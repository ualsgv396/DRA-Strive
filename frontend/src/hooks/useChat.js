import { useState, useCallback, useEffect, useRef } from 'react'
import { useStompClient } from './useStompClient'
import api from '../api/axios'

/**
 * Hook principal del chat.
 *
 * Gestiona:
 *  - Conexión STOMP (se establece al montar, se destruye al desmontar)
 *  - Lista de conversaciones con badge de no leídos
 *  - Conversación activa + historial de mensajes
 *  - Envío de mensajes (texto y rutinas compartidas)
 *  - Presencia EN VIVO de amigos (online/offline) vía /user/queue/presence
 *
 * Patrón clave: `conversacionActivaRef` evita el problema de stale closure
 * dentro del handler STOMP, que se configura una sola vez en onConnect.
 */
export function useChat() {
  const [conectado,              setConectado]              = useState(false)
  const [conversaciones,         setConversaciones]         = useState([])
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false)
  const [conversacionActiva,     setConversacionActiva]     = useState(null)
  const [mensajes,               setMensajes]               = useState([])
  const [cargandoMensajes,       setCargandoMensajes]       = useState(false)
  // Mapa de presencia en vivo: { [userId]: boolean }. Se rellena con los
  // eventos /user/queue/presence y tiene prioridad sobre el snapshot REST.
  const [presencia,              setPresencia]              = useState({})

  // Ref sincronizada para evitar stale closure en el handler STOMP
  const conversacionActivaRef = useRef(null)
  useEffect(() => {
    conversacionActivaRef.current = conversacionActiva
  }, [conversacionActiva])

  // ── REST helpers ─────────────────────────────────────────────────────────

  const cargarConversaciones = useCallback(async () => {
    setCargandoConversaciones(true)
    try {
      const { data } = await api.get('/chat/conversations')
      setConversaciones(data)
      // Sembrar el mapa de presencia con el snapshot inicial del servidor
      setPresencia(prev => {
        const next = { ...prev }
        data.forEach(c => {
          if (c.otherUser) next[c.otherUser.id] = c.otherUser.online
        })
        return next
      })
    } catch (e) {
      console.error('[Chat] Error al cargar conversaciones:', e)
    } finally {
      setCargandoConversaciones(false)
    }
  }, [])

  // ── STOMP callbacks ───────────────────────────────────────────────────────

  const handleDesconexion = useCallback(() => setConectado(false), [])
  const handleAuthError   = useCallback(() => {
    console.warn('[Chat] Sesión WebSocket rechazada — token inválido o expirado')
  }, [])

  const onConnect = useCallback((client) => {
    setConectado(true)

    // Mensajes entrantes (propios en echo + del otro usuario)
    client.subscribe('/user/queue/mensajes', (frame) => {
      const mensaje = JSON.parse(frame.body)
      const convActivaId = conversacionActivaRef.current?.id

      if (convActivaId === mensaje.conversationId) {
        // El usuario está leyendo esta conversación: añadir al historial
        setMensajes(prev => {
          // Evitar duplicados por el echo del propio remitente
          if (prev.some(m => m.id === mensaje.id)) return prev
          return [...prev, mensaje]
        })
        // Marcar como leído en el servidor (fire & forget)
        api.patch(`/chat/conversations/${mensaje.conversationId}/read`).catch(() => {})
      } else {
        // Otra conversación: incrementar badge de no leídos
        setConversaciones(prev =>
          prev.map(c =>
            c.id === mensaje.conversationId
              ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1, lastMessageAt: mensaje.sentAt }
              : c
          )
        )
      }
    })

    // Presencia en vivo: un amigo se conectó o desconectó
    client.subscribe('/user/queue/presence', (frame) => {
      const evento = JSON.parse(frame.body)   // { userId, fullName, online }
      // 1. Mapa de presencia (lo consume la lista de amigos en Amigos.jsx)
      setPresencia(prev => ({ ...prev, [evento.userId]: evento.online }))
      // 2. Reflejarlo también en las conversaciones (cabecera/listado)
      setConversaciones(prev =>
        prev.map(c =>
          c.otherUser?.id === evento.userId
            ? { ...c, otherUser: { ...c.otherUser, online: evento.online } }
            : c
        )
      )
      // 3. Si la conversación abierta es con ese usuario, actualizar su cabecera
      setConversacionActiva(prev =>
        prev?.otherUser?.id === evento.userId
          ? { ...prev, otherUser: { ...prev.otherUser, online: evento.online } }
          : prev
      )
    })

    // Errores del servidor (validación, auth, etc.)
    client.subscribe('/user/queue/errores', (frame) => {
      console.error('[Chat] Error del servidor STOMP:', JSON.parse(frame.body))
    })

    // Cargar conversaciones al conectar
    cargarConversaciones()
  }, [cargarConversaciones])

  const { connect, disconnect, clientRef } = useStompClient({
    onConnect,
    onDisconnect: handleDesconexion,
    onAuthError:  handleAuthError,
  })

  // Conectar al montar el componente que use el hook; desconectar al desmontar
  useEffect(() => {
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  // ── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Abre (o crea) la conversación con un amigo por su ID.
   * Carga el historial y marca los mensajes como leídos.
   */
  const abrirConversacion = useCallback(async (amigoId) => {
    setCargandoMensajes(true)
    setMensajes([])
    setConversacionActiva(null)
    try {
      const { data: conv }  = await api.post(`/chat/conversations/${amigoId}`)
      setConversacionActiva(conv)

      const { data: historial } = await api.get(`/chat/conversations/${conv.id}/messages`)
      setMensajes(historial)

      await api.patch(`/chat/conversations/${conv.id}/read`)

      // Resetear badge en la lista local
      setConversaciones(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      )
    } catch (e) {
      console.error('[Chat] Error al abrir conversación:', e)
    } finally {
      setCargandoMensajes(false)
    }
  }, [])

  /** Cierra la ventana de chat activa. */
  const cerrarConversacion = useCallback(() => {
    setConversacionActiva(null)
    setMensajes([])
  }, [])

  /**
   * Envía un mensaje vía STOMP.
   * El servidor hace echo de vuelta para confirmar persistencia.
   */
  const enviarMensaje = useCallback((
    content,
    type                = 'TEXT',
    routineId           = null,
    routineNameSnapshot = null
  ) => {
    if (!clientRef.current?.active) {
      console.warn('[Chat] Sin conexión WebSocket — no se puede enviar')
      return
    }
    if (!conversacionActivaRef.current) {
      console.warn('[Chat] Sin conversación activa')
      return
    }
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId:      conversacionActivaRef.current.id,
        content,
        type,
        routineId,
        routineNameSnapshot,
      }),
    })
  }, [clientRef])

  return {
    conectado,
    conversaciones,
    cargandoConversaciones,
    conversacionActiva,
    mensajes,
    cargandoMensajes,
    presencia,
    abrirConversacion,
    cerrarConversacion,
    enviarMensaje,
    cargarConversaciones,
  }
}
