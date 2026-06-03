import { useCallback, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const RECONECTAR_DELAY_MS = 5_000

/**
 * Deriva la URL base del WebSocket a partir de VITE_API_URL.
 * Ejemplo: "http://localhost:8080/api" → "http://localhost:8080/ws"
 */
function resolverWsUrl() {
  const apiUrl = new URL(import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api')
  return `${apiUrl.origin}/ws`
}

/**
 * Hook que gestiona el ciclo de vida de la conexión STOMP autenticada.
 *
 * Issue 1.1 — conexión, desconexión y manejo de errores.
 * Issue 1.2 — el JWT se envía como header STOMP en el frame CONNECT;
 *             si el servidor rechaza el token se detiene la reconexión
 *             automática y se invoca `onAuthError`.
 *
 * @param {object}                   opciones
 * @param {(client: Client) => void} [opciones.onConnect]    Callback al conectarse
 * @param {() => void}               [opciones.onDisconnect] Callback al desconectarse
 * @param {() => void}               [opciones.onAuthError]  Callback si el token es inválido
 */
export function useStompClient({ onConnect, onDisconnect, onAuthError } = {}) {
  const clientRef = useRef(null)

  // Guardamos callbacks en refs para que `connect` no cambie de referencia
  // cada vez que el padre re-renderice con funciones inline nuevas.
  const onConnectRef    = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onAuthErrorRef  = useRef(onAuthError)
  useEffect(() => { onConnectRef.current    = onConnect    }, [onConnect])
  useEffect(() => { onDisconnectRef.current = onDisconnect }, [onDisconnect])
  useEffect(() => { onAuthErrorRef.current  = onAuthError  }, [onAuthError])

  const connect = useCallback(() => {
    // Evitar doble activación (React StrictMode en desarrollo)
    if (clientRef.current?.active) return

    const client = new Client({
      webSocketFactory: () => new SockJS(resolverWsUrl()),

      // reconnectDelay > 0 permite reintentar si cae la red.
      // Se pone a 0 si el servidor rechaza el token para evitar bucles.
      reconnectDelay: RECONECTAR_DELAY_MS,

      // beforeConnect se llama antes de CADA intento (inicial + reconexiones).
      // Leemos el token aquí para usar siempre el más reciente del localStorage.
      beforeConnect: async () => {
        client.connectHeaders = {
          Authorization: `Bearer ${localStorage.getItem('strive_token') ?? ''}`,
        }
      },

      onConnect: (frame) => {
        if (import.meta.env.DEV) {
          console.log('[STOMP] Conexión autenticada', frame)
        }
        onConnectRef.current?.(client)
      },

      onDisconnect: () => {
        if (import.meta.env.DEV) {
          console.log('[STOMP] Desconectado')
        }
        onDisconnectRef.current?.()
      },

      onStompError: (frame) => {
        const mensaje = frame.headers['message'] ?? 'Error desconocido'
        console.error('[STOMP] Error de protocolo:', mensaje, frame.body)

        // Si el servidor envía un ERROR relacionado con el token,
        // detenemos la reconexión automática para no entrar en bucle infinito
        // con credenciales que el servidor ya ha rechazado.
        const esErrorDeAuth = mensaje.toLowerCase().includes('token')
          || mensaje.toLowerCase().includes('autenticación')
          || mensaje.toLowerCase().includes('expirado')
        if (esErrorDeAuth) {
          client.reconnectDelay = 0
          onAuthErrorRef.current?.()
        }
      },

      onWebSocketError: (event) => {
        console.error('[STOMP] Error de WebSocket:', event)
      },
    })

    client.activate()
    clientRef.current = client
  }, []) // sin deps: callbacks y URL se leen desde refs y env estable

  const disconnect = useCallback(async () => {
    if (clientRef.current?.active) {
      await clientRef.current.deactivate()
      if (import.meta.env.DEV) {
        console.log('[STOMP] Cliente desactivado manualmente')
      }
    }
  }, [])

  // Limpieza al desmontar el componente consumidor
  useEffect(() => {
    return () => {
      clientRef.current?.deactivate()
    }
  }, [])

  return { connect, disconnect, clientRef }
}
