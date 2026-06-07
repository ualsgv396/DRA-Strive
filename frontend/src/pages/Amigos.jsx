import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useChat } from '../hooks/useChat'
import VentanaChat from '../components/chat/VentanaChat'
import FeedItem from '../components/feed/FeedItem'

// ── Helpers visuales ──────────────────────────────────────────────────────────

const RED      = '#E63946'
const RED_DARK = '#C1121F'

const AVATAR_HUES = [354, 18, 168, 262, 210, 38]
function hueDe(txt = '') {
  let h = 0
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) % 360
  return AVATAR_HUES[h % AVATAR_HUES.length]
}

function Avatar({ nombre = '?', size = 44, online }) {
  const hue     = hueDe(nombre)
  const inicial = (nombre.trim()[0] || '?').toUpperCase()
  const dot     = Math.round(size * 0.28)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Oswald', sans-serif", fontWeight: 700, lineHeight: 1,
        fontSize: size * 0.42, color: `oklch(0.92 0.09 ${hue})`,
        background: `oklch(0.30 0.07 ${hue} / 0.55)`,
        boxShadow: `inset 0 0 0 1.5px oklch(0.65 0.13 ${hue} / 0.6)`,
      }}>
        {inicial}
      </div>
      {online != null && (
        <span style={{
          position: 'absolute', right: -1, bottom: -1, width: dot, height: dot,
          borderRadius: '50%', background: online ? '#22C55E' : '#71717A',
          boxShadow: '0 0 0 2.5px #1A1A1A',
        }} />
      )}
    </div>
  )
}

// Iconos inline (stroke = currentColor)
const Icono = {
  dumbbell: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/></svg>,
  search:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  copy:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
  check:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  plus:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  chat:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
}

// Tiempo relativo corto para la última actividad de una conversación
function tiempoRelativo(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  const diff = Date.now() - fecha.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `${dias} d`
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Amigos() {
  const location = useLocation()
  const chat     = useChat()

  const [tab, setTab] = useState('actividad')  // 'actividad' | 'amigos'

  const [busqueda, setBusqueda] = useState('')
  const [amigos, setAmigos] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [resultados, setResultados] = useState([])
  const [invitacion, setInvitacion] = useState(null)
  const [procesandoInvitacion, setProcesandoInvitacion] = useState(false)
  const [estadoBusqueda, setEstadoBusqueda] = useState('')
  const [enlaceCopiado, setEnlaceCopiado] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [feedItems, setFeedItems]         = useState([])
  const [cargandoFeed, setCargandoFeed]   = useState(true)
  const [errorFeed, setErrorFeed]         = useState('')

  const cargarFeed = useCallback(async () => {
    setCargandoFeed(true)
    setErrorFeed('')
    try {
      const { data } = await api.get('/feed')
      setFeedItems(data ?? [])
    } catch {
      setErrorFeed('No se pudo cargar el feed de actividad')
    } finally {
      setCargandoFeed(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
    cargarFeed()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const inviteToken = params.get('invite')
    if (!inviteToken) return
    aceptarInvitacion(inviteToken)
  }, [location.search])

  const cargarDatos = async () => {
    try {
      const [respAmigos, respSolicitudes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests/incoming')
      ])
      setAmigos(respAmigos.data)
      setSolicitudes(respSolicitudes.data)
    } catch (error) {
      setMensaje(error.response?.data?.message || 'No se pudo cargar el modulo de amigos')
    }
  }

  const buscarUsuarios = async () => {
    if (!busqueda.trim()) {
      setResultados([])
      return
    }
    setEstadoBusqueda('Buscando...')
    try {
      const response = await api.get('/friends/search', {
        params: { nickname: busqueda.trim() }
      })
      setResultados(response.data)
      setEstadoBusqueda('')
    } catch (error) {
      setEstadoBusqueda(error.response?.data?.message || 'Error al buscar usuarios')
    }
  }

  const enviarSolicitud = async (targetUserId) => {
    try {
      await api.post('/friends/requests', { targetUserId })
      setMensaje('Solicitud enviada')
      buscarUsuarios()
    } catch (error) {
      setMensaje(error.response?.data?.message || 'No se pudo enviar la solicitud')
    }
  }

  const aceptarSolicitud = async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/accept`)
      await cargarDatos()
      setMensaje('Solicitud aceptada')
    } catch (error) {
      setMensaje(error.response?.data?.message || 'No se pudo aceptar la solicitud')
    }
  }

  const generarInvitacion = async () => {
    try {
      const response = await api.post('/friends/invitations')
      setInvitacion(response.data)
      setMensaje('Invitacion generada')
    } catch (error) {
      setMensaje(error.response?.data?.message || 'No se pudo generar la invitacion')
    }
  }

  const aceptarInvitacion = async (token) => {
    setProcesandoInvitacion(true)
    try {
      await api.post(`/friends/invitations/${token}/accept`)
      setMensaje('Invitacion aceptada. Ya son amigos.')
      await cargarDatos()
    } catch (error) {
      setMensaje(error.response?.data?.message || 'No se pudo aceptar la invitacion')
    } finally {
      setProcesandoInvitacion(false)
    }
  }

  const handleReaccion = useCallback((sessionId, _emoji, updatedReacciones) => {
    setFeedItems(prev =>
      prev.map(item =>
        item.sessionId === sessionId
          ? { ...item, reacciones: updatedReacciones }
          : item
      )
    )
  }, [])

  const copiarEnlace = async () => {
    if (!invitacion?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(invitacion.inviteUrl)
      setEnlaceCopiado(true)
      setTimeout(() => setEnlaceCopiado(false), 1600)
    } catch (error) {
      console.error('No se pudo copiar el enlace', error)
    }
  }

  return (
    <div style={estilos.contenedor}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <main style={estilos.main}>

        {/* ── Hero ── */}
        <header style={estilos.hero}>
          <div style={estilos.heroIco}><Icono.dumbbell width={20} height={20} /></div>
          <div>
            <span style={estilos.kicker}>CONEXIONES</span>
            <h1 style={estilos.titulo}>Amigos</h1>
          </div>
        </header>
        <p style={estilos.subtitulo}>
          Busca por nickname o comparte tu QR/enlace para conectar al instante.
        </p>

        {/* ── Stats ── */}
        <div style={estilos.stats}>
          <div style={estilos.statCard}>
            <span style={estilos.statNum}>{amigos.length}</span>
            <span style={estilos.statLabel}>Amigos</span>
          </div>
          <div style={estilos.statCard}>
            <span style={{ ...estilos.statNum, color: solicitudes.length ? RED : '#fff' }}>{solicitudes.length}</span>
            <span style={estilos.statLabel}>Solicitudes</span>
          </div>
          <div style={estilos.statCard}>
            <span style={{ ...estilos.statNum, color: '#22C55E' }}>{amigos.filter((a) => chat.presencia[a.id] ?? a.online).length}</span>
            <span style={estilos.statLabel}>En línea</span>
          </div>
        </div>

        {/* ── Tabs: Actividad / Red Social ── */}
        <div style={estilos.tabs}>
          <button
            onClick={() => setTab('actividad')}
            style={{ ...estilos.tabBtn, ...(tab === 'actividad' ? estilos.tabActivo : {}) }}
          >
             Actividad
          </button>
          <button
            onClick={() => setTab('amigos')}
            style={{ ...estilos.tabBtn, ...(tab === 'amigos' ? estilos.tabActivo : {}) }}
          >
             Red social
          </button>
        </div>

        {/* ── Tab: Feed de actividad ── */}
        {tab === 'actividad' && (
          <section style={{ marginBottom: 24 }}>
            {cargandoFeed && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div style={estilos.spinner} />
              </div>
            )}
            {!cargandoFeed && errorFeed && (
              <p style={{ ...estilos.textoSuave, color: RED, textAlign: 'center' }}>{errorFeed}</p>
            )}
            {!cargandoFeed && !errorFeed && feedItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: 44, opacity: 0.5 }}>🏋️</span>
                <p style={{ ...estilos.textoSuave, marginTop: 12 }}>
                  Cuando tus amigos completen un entreno aparecerá aquí.
                </p>
              </div>
            )}
            {!cargandoFeed && feedItems.map(item => (
              <div key={item.sessionId} style={{ marginBottom: 12 }}>
                <FeedItem item={item} onReaccion={handleReaccion} />
              </div>
            ))}
          </section>
        )}

        {/* ── Tab: Red social (contenido original) ── */}
        {tab === 'amigos' && (
          <>

        {/* ── Conversaciones recientes ── */}
        {chat.conversaciones.length > 0 && (
          <section style={estilos.lista}>
            <div style={estilos.listaHead}>
              <h2 style={estilos.tituloLista}>Conversaciones</h2>
              <span style={estilos.contador}>{chat.conversaciones.length}</span>
            </div>
            <div style={estilos.listaItems}>
              {[...chat.conversaciones]
                .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))
                .map((conv) => (
                  <button
                    key={conv.id}
                    style={estilos.itemConversacion}
                    className="card-press"
                    onClick={() => chat.abrirConversacion(conv.otherUser.id)}
                  >
                    <div style={estilos.persona}>
                      <Avatar nombre={conv.otherUser.fullName} size={44} online={conv.otherUser.online} />
                      <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <p style={estilos.nombre}>{conv.otherUser.fullName}</p>
                        <p style={estilos.nickname}>
                          {conv.otherUser.online ? <span style={estilos.online}>En línea</span> : `@${conv.otherUser.nickname}`}
                        </p>
                      </div>
                    </div>
                    <div style={estilos.convMeta}>
                      {conv.lastMessageAt && <span style={estilos.convHora}>{tiempoRelativo(conv.lastMessageAt)}</span>}
                      {conv.unreadCount > 0 && <span style={estilos.unread}>{conv.unreadCount}</span>}
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ── Buscar ── */}
        <section style={estilos.bloqueBuscar}>
          <label style={estilos.label}>Buscar por nickname</label>
          <div style={estilos.filaBuscar}>
            <div style={estilos.inputWrap}>
              <span style={estilos.inputIco}><Icono.search width={18} height={18} /></span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarUsuarios()}
                placeholder="@nickname"
                style={estilos.input}
              />
            </div>
            <button style={estilos.btnPrimario} onClick={buscarUsuarios}>Buscar</button>
          </div>
          {busqueda.trim() && (
            <div style={estilos.resultados}>
              {estadoBusqueda && <p style={estilos.textoSuave}>{estadoBusqueda}</p>}
              {!estadoBusqueda && resultados.length === 0 && (
                <p style={estilos.textoSuave}>No encontramos usuarios con ese nickname.</p>
              )}
              {resultados.map((usuario) => (
                <div key={usuario.id} style={estilos.itemPersona}>
                  <div style={estilos.persona}>
                    <Avatar nombre={usuario.fullName} size={42} />
                    <div style={{ minWidth: 0 }}>
                      <p style={estilos.nombre}>{usuario.fullName}</p>
                      <p style={estilos.nickname}>@{usuario.nickname}</p>
                    </div>
                  </div>
                  {usuario.relation === 'NONE' ? (
                    <button style={estilos.btnAgregar} onClick={() => enviarSolicitud(usuario.id)}>
                      <Icono.plus width={16} height={16} /> Agregar
                    </button>
                  ) : (
                    <span style={estilos.textoSuave}>{traducirRelacion(usuario.relation)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── QR + Enlace ── */}
        <section style={estilos.grid2}>
          <article style={estilos.tarjeta}>
            <h2 style={estilos.tarjetaTitulo}>Compartir QR</h2>
            <div style={estilos.qrRow}>
              {invitacion?.qrImageBase64 ? (
                <div style={estilos.qrBox}>
                  <img
                    src={`data:image/png;base64,${invitacion.qrImageBase64}`}
                    alt="QR de invitacion"
                    style={estilos.qrImg}
                  />
                </div>
              ) : (
                <button style={estilos.btnPrimario} onClick={generarInvitacion}>Generar QR</button>
              )}
              <p style={estilos.textoSuave}>Muestra este QR y la amistad se crea automaticamente al escanearlo.</p>
            </div>
          </article>

          <article style={estilos.tarjeta}>
            <h2 style={estilos.tarjetaTitulo}>Enlace de invitacion</h2>
            <div style={estilos.enlaceBox}>
              <span style={estilos.enlaceTexto}>
                {invitacion?.inviteUrl || 'Genera primero una invitacion'}
              </span>
            </div>
            <button
              style={{ ...estilos.btnPrimario, width: '100%', marginTop: 10, justifyContent: 'center' }}
              onClick={invitacion ? copiarEnlace : generarInvitacion}
            >
              {invitacion
                ? (enlaceCopiado
                    ? <><Icono.check width={16} height={16} /> Copiado</>
                    : <><Icono.copy width={16} height={16} /> Copiar enlace</>)
                : 'Generar invitacion'}
            </button>
            <p style={{ ...estilos.textoSuave, marginTop: 10 }}>Compartelo y la amistad se crea en un toque.</p>
          </article>
        </section>

        {/* ── Solicitudes ── */}
        {solicitudes.length > 0 && (
          <section style={estilos.lista}>
            <div style={estilos.listaHead}>
              <h2 style={estilos.tituloLista}>Solicitudes pendientes</h2>
              <span style={estilos.contador}>{solicitudes.length}</span>
            </div>
            <div style={estilos.listaItems}>
              {solicitudes.map((solicitud) => (
                <div key={solicitud.requestId} style={estilos.itemPersona}>
                  <div style={estilos.persona}>
                    <Avatar nombre={solicitud.fromUser.fullName} size={42} />
                    <div style={{ minWidth: 0 }}>
                      <p style={estilos.nombre}>{solicitud.fromUser.fullName}</p>
                      <p style={estilos.nickname}>@{solicitud.fromUser.nickname}</p>
                    </div>
                  </div>
                  <button style={estilos.btnAgregar} onClick={() => aceptarSolicitud(solicitud.requestId)}>
                    <Icono.check width={16} height={16} /> Aceptar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Mis amigos ── */}
        <section style={estilos.lista}>
          <div style={estilos.listaHead}>
            <h2 style={estilos.tituloLista}>Mis amigos</h2>
            <span style={estilos.contador}>{amigos.length}</span>
          </div>
          <div style={estilos.listaItems}>
            {amigos.length === 0 && <p style={estilos.textoSuave}>Aun no tienes amigos agregados.</p>}
            {amigos.map((amigo) => {
              const enLinea = chat.presencia[amigo.id] ?? amigo.online
              return (
              <div key={amigo.id} style={estilos.itemPersona} className="card-press">
                <div style={estilos.persona}>
                  <Avatar nombre={amigo.fullName} size={44} online={enLinea} />
                  <div style={{ minWidth: 0 }}>
                    <p style={estilos.nombre}>{amigo.fullName}</p>
                    <p style={estilos.nickname}>{enLinea ? <span style={estilos.online}>En línea</span> : `@${amigo.nickname}`}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={estilos.badgeAmigo}>Amigo</span>
                  <button
                    style={estilos.btnChat}
                    onClick={() => chat.abrirConversacion(amigo.id)}
                    aria-label={`Chatear con ${amigo.fullName}`}
                  >
                    <Icono.chat width={20} height={20} />
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        </section>

        {procesandoInvitacion && <p style={estilos.textoSuave}>Procesando invitacion...</p>}
        {mensaje && <p style={estilos.mensaje}>{mensaje}</p>}

          </>
        )}

      </main>

      {/* Overlay de chat: se renderiza encima cuando hay conversación activa */}
      <VentanaChat
        conversacionActiva={chat.conversacionActiva}
        mensajes={chat.mensajes}
        cargandoMensajes={chat.cargandoMensajes}
        onCerrar={chat.cerrarConversacion}
        onEnviar={chat.enviarMensaje}
      />
    </div>
  )
}

function traducirRelacion(relacion) {
  if (relacion === 'FRIEND') return 'Ya son amigos'
  if (relacion === 'REQUEST_SENT') return 'Solicitud enviada'
  if (relacion === 'REQUEST_RECEIVED') return 'Te envio solicitud'
  return 'Disponible'
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const estilos = {
  contenedor: { minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#FFFFFF', paddingBottom: '104px' },
  main: { maxWidth: '980px', margin: '0 auto', padding: '36px clamp(16px, 4vw, 28px) 0' },

  hero: { display: 'flex', alignItems: 'center', gap: 14 },
  heroIco: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0, color: RED,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(230,57,70,0.12)', boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.32)',
  },
  kicker: { display: 'block', color: RED, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, fontFamily: "'Inter', sans-serif" },
  titulo: { fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(38px, 7vw, 50px)', fontWeight: 700, textTransform: 'uppercase', margin: 0, lineHeight: 1 },
  subtitulo: { color: 'rgba(255,255,255,0.45)', fontSize: 14.5, margin: '12px 0 22px', maxWidth: 560, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" },

  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 },
  statCard: { background: '#131313', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 },
  itemConversacion: {
    width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
    backgroundColor: '#1A1A1A', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  },
  convMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  convHora: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" },
  unread: {
    minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: RED, color: '#fff',
    fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  statNum: { fontFamily: "'Oswald', sans-serif", fontSize: 30, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },

  bloqueBuscar: { backgroundColor: '#131313', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', padding: 18, marginBottom: 16 },
  label: { display: 'block', marginBottom: 10, fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 },
  filaBuscar: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  inputWrap: { flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 10, background: '#222222', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '0 14px' },
  inputIco: { color: 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0 },
  input: { flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15, padding: '13px 0', fontFamily: "'Inter', sans-serif" },
  btnPrimario: {
    border: 'none', borderRadius: 12, background: `linear-gradient(160deg, ${RED}, ${RED_DARK})`, color: '#fff',
    fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: 14,
    padding: '0 22px', minHeight: 48, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
    boxShadow: '0 8px 28px rgba(230,57,70,0.32)', whiteSpace: 'nowrap',
  },
  resultados: { marginTop: 14, display: 'grid', gap: 8 },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 },
  tarjeta: { backgroundColor: '#131313', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', padding: 20 },
  tarjetaTitulo: { fontFamily: "'Oswald', sans-serif", fontSize: 22, textTransform: 'uppercase', margin: '0 0 14px', fontWeight: 600 },
  tituloLista: { fontFamily: "'Oswald', sans-serif", fontSize: 22, textTransform: 'uppercase', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' },
  qrRow: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  qrBox: { background: '#fff', borderRadius: 14, padding: 10, flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  qrImg: { width: 116, height: 116, display: 'block', borderRadius: 4 },
  enlaceBox: { background: '#222222', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', padding: '13px 14px' },
  enlaceTexto: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: "'Inter', sans-serif", wordBreak: 'break-all', lineHeight: 1.4 },

  lista: { backgroundColor: '#131313', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', padding: 18, marginBottom: 16 },
  listaHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  contador: {
    fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, minWidth: 26, height: 26, padding: '0 8px',
    borderRadius: 999, background: 'rgba(230,57,70,0.14)', color: RED, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.3)',
  },
  listaItems: { display: 'grid', gap: 8 },
  itemPersona: {
    backgroundColor: '#1A1A1A', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  },
  persona: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  nombre: { fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: 15, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  nickname: { color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  online: { color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: 5 },
  textoSuave: { color: 'rgba(255,255,255,0.45)', fontSize: 13.5, lineHeight: 1.5, margin: 0 },

  badgeAmigo: { borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#22C55E', backgroundColor: 'rgba(34,197,94,0.15)', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' },
  btnAgregar: {
    border: '1px solid rgba(230,57,70,0.4)', background: 'rgba(230,57,70,0.12)', color: '#fff',
    borderRadius: 10, fontWeight: 600, fontSize: 13.5, minHeight: 40, padding: '0 14px', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, fontFamily: "'Inter', sans-serif",
  },
  btnChat: {
    border: 'none', background: `linear-gradient(160deg, ${RED}, ${RED_DARK})`, color: '#fff',
    width: 44, height: 44, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(230,57,70,0.32)',
  },
  mensaje: { marginTop: 12, color: RED, fontSize: 13, fontFamily: "'Inter', sans-serif" },

  // ── Tabs ──
  tabs: {
    display: 'flex', gap: 6, marginBottom: 20,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 5,
  },
  tabBtn: {
    flex: 1, padding: '10px 0',
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14,
    borderRadius: 10, border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.45)', background: 'transparent',
    transition: 'background .15s, color .15s',
  },
  tabActivo: {
    background: `linear-gradient(160deg, ${RED}, ${RED_DARK})`,
    color: '#fff',
    boxShadow: '0 4px 16px rgba(230,57,70,0.28)',
  },

  spinner: {
    width: 28, height: 28,
    border: '3px solid rgba(230,57,70,0.2)',
    borderTop: `3px solid ${RED}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}
