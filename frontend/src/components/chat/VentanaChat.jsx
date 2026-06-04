import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ContextoAuth'

// ── Helpers visuales ──────────────────────────────────────────────────────────

const RED      = '#E63946'
const RED_DARK = '#C1121F'

// Color estable derivado del nombre (para el avatar)
const AVATAR_HUES = [354, 18, 168, 262, 210, 38]
function hueDe(txt = '') {
  let h = 0
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) % 360
  return AVATAR_HUES[h % AVATAR_HUES.length]
}

function Avatar({ nombre = '?', size = 40, online, ring = true }) {
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
        boxShadow: ring ? `inset 0 0 0 1.5px oklch(0.65 0.13 ${hue} / 0.6)` : 'none',
      }}>
        {inicial}
      </div>
      {online != null && (
        <span style={{
          position: 'absolute', right: -1, bottom: -1, width: dot, height: dot,
          borderRadius: '50%', background: online ? '#22C55E' : '#71717A',
          boxShadow: '0 0 0 2.5px #161616',
        }} />
      )}
    </div>
  )
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

function BurbujaMensaje({ mensaje, esMio, conCola, mostrarAvatar, nombre }) {
  const navigate = useNavigate()
  const hora = new Date(mensaje.sentAt).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  const Wrap = ({ children, ancho }) => (
    <div style={{ ...s.fila, justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
      {!esMio && (
        <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end' }}>
          {mostrarAvatar && <Avatar nombre={nombre} size={28} ring={false} />}
        </div>
      )}
      <div style={{ maxWidth: ancho }}>{children}</div>
    </div>
  )

  if (mensaje.type === 'ROUTINE') {
    return (
      <Wrap ancho="82%">
        <div style={{ ...s.rutina, ...(esMio ? s.rutinaMia : s.rutinaSuya) }}>
          <div style={s.rutinaHead}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={RED}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>
            </svg>
            <span style={s.rutinaLabel}>Rutina compartida</span>
          </div>
          <p style={s.rutinaName}>{mensaje.routineNameSnapshot ?? 'Rutina eliminada'}</p>
          {mensaje.content && <p style={s.rutinaNota}>{mensaje.content}</p>}
          {mensaje.routineId && (
            <button onClick={() => navigate(`/rutina/${mensaje.routineId}`)} style={s.rutinaBtn}>
              Ver rutina
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          )}
          <span style={{ ...s.hora, color: esMio ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.45)' }}>{hora}</span>
        </div>
      </Wrap>
    )
  }

  const radio = esMio
    ? `18px 18px ${conCola ? '5px' : '18px'} 18px`
    : `18px 18px 18px ${conCola ? '5px' : '18px'}`

  return (
    <Wrap ancho="74%">
      <div style={{ ...s.bubble, ...(esMio ? s.bubbleMio : s.bubbleSuyo), borderRadius: radio }}>
        <span style={s.bubbleTexto}>{mensaje.content}</span>
        <span style={{ ...s.hora, color: esMio ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)' }}>{hora}</span>
      </div>
    </Wrap>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function VentanaChat({
  conversacionActiva,
  mensajes,
  cargandoMensajes,
  onCerrar,
  onEnviar,
}) {
  const { usuario } = useAuth()
  const [texto, setTexto] = useState('')
  const areaRef  = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll al fondo cuando llega un mensaje (sin scrollIntoView)
  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [mensajes, cargandoMensajes])

  // Foco al abrir
  useEffect(() => {
    if (conversacionActiva) setTimeout(() => inputRef.current?.focus(), 60)
  }, [conversacionActiva])

  const handleEnviar = () => {
    if (!texto.trim()) return
    onEnviar(texto.trim())
    setTexto('')
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
  }

  if (!conversacionActiva) return null

  const otroUsuario = conversacionActiva.otherUser

  return (
    <div style={s.overlay}>
      <div style={s.ventana}>

        {/* Header */}
        <header style={s.header}>
          <button onClick={onCerrar} style={s.btnVolver} aria-label="Cerrar chat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <Avatar nombre={otroUsuario.fullName} size={40} online={otroUsuario.online} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={s.hNombre}>{otroUsuario.fullName}</p>
            <p style={s.hEstado}>
              {otroUsuario.online
                ? <span style={s.online}><span style={s.onlineDot} /> En línea</span>
                : otroUsuario.nickname && <span>@{otroUsuario.nickname}</span>}
            </p>
          </div>
        </header>

        {/* Área de mensajes */}
        <div style={s.mensajesArea} ref={areaRef}>
          {(() => {
            if (cargandoMensajes) {
              return <div style={s.centrado}><div style={s.spinner} /></div>
            }
            if (mensajes.length === 0) {
              return (
                <div style={s.vacio}>
                  <div style={s.vacioIco}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                    </svg>
                  </div>
                  <p style={s.vacioTitulo}>Di hola 👋</p>
                  <p style={s.vacioSub}>Sois amigos — empieza la conversación</p>
                </div>
              )
            }
            return (
              <>
                <div style={s.diaWrap}><span style={s.diaChip}>HOY</span></div>
                {mensajes.map((m, i) => {
                  const esMio    = m.senderId === usuario?.id
                  const sig      = mensajes[i + 1]
                  const finGrupo = !sig || sig.senderId !== m.senderId || sig.type === 'ROUTINE' || m.type === 'ROUTINE'
                  const prev     = mensajes[i - 1]
                  const sep      = i > 0 && prev.senderId !== m.senderId
                  return (
                    <div key={m.id} style={{ marginTop: sep ? 10 : 2 }}>
                      <BurbujaMensaje
                        mensaje={m}
                        esMio={esMio}
                        conCola={finGrupo}
                        mostrarAvatar={!esMio && finGrupo}
                        nombre={otroUsuario.fullName}
                      />
                    </div>
                  )
                })}
              </>
            )
          })()}
        </div>

        {/* Composer */}
        <div style={s.composer}>
          <div style={s.inputWrap}>
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje…"
              rows={1}
              style={s.textarea}
            />
          </div>
          <button
            onClick={handleEnviar}
            disabled={!texto.trim()}
            style={{ ...s.btnEnviar, ...(texto.trim() ? s.btnEnviarOn : {}) }}
            aria-label="Enviar mensaje"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 500,
    backgroundColor: '#0D0D0D', display: 'flex', flexDirection: 'column',
  },
  ventana: {
    flex: 1, display: 'flex', flexDirection: 'column',
    maxWidth: '720px', width: '100%', margin: '0 auto', overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, #161616, #111)', flexShrink: 0,
  },
  btnVolver: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.72)', cursor: 'pointer', width: 38, height: 38,
    borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hNombre: {
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  hEstado: { fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' },
  online: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#22C55E' },
  onlineDot: { width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.8)' },

  // Área mensajes
  mensajesArea: {
    flex: 1, overflowY: 'auto', padding: '14px 16px 10px', display: 'flex', flexDirection: 'column',
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
  },
  diaWrap: { display: 'flex', justifyContent: 'center', margin: '4px 0 12px' },
  diaChip: {
    fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: 1.5, fontWeight: 600,
    color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: 999,
  },
  centrado: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: {
    width: 28, height: 28, border: '3px solid rgba(230,57,70,0.25)',
    borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  vacio: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },
  vacioIco: {
    width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: RED, background: 'rgba(230,57,70,0.12)', boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.3)', marginBottom: 8,
  },
  vacioTitulo: { fontFamily: "'Oswald', sans-serif", fontSize: 24, color: 'rgba(255,255,255,0.72)', margin: 0 },
  vacioSub: { fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 },

  // Burbujas
  fila: { display: 'flex', width: '100%', gap: 7, alignItems: 'flex-end' },
  bubble: { padding: '8px 13px 6px', wordBreak: 'break-word', boxShadow: '0 1px 2px rgba(0,0,0,0.35)' },
  bubbleMio: { background: `linear-gradient(160deg, ${RED}, ${RED_DARK})`, color: '#fff' },
  bubbleSuyo: { background: '#222222', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' },
  bubbleTexto: { fontFamily: "'Inter', sans-serif", fontSize: 14.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' },
  hora: { display: 'block', fontSize: 10, marginTop: 3, textAlign: 'right', fontFamily: "'Inter', sans-serif" },

  // Tarjeta rutina
  rutina: { borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, wordBreak: 'break-word' },
  rutinaMia: { background: 'linear-gradient(160deg, rgba(230,57,70,0.22), rgba(193,18,31,0.16))', border: '1px solid rgba(230,57,70,0.4)' },
  rutinaSuya: { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.10)' },
  rutinaHead: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 },
  rutinaLabel: { fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: RED },
  rutinaName: { fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, textTransform: 'uppercase', lineHeight: 1.15 },
  rutinaNota: { fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0 },
  rutinaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    background: 'rgba(230,57,70,0.16)', border: '1px solid rgba(230,57,70,0.4)', color: '#fff',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer',
    padding: '7px 12px', borderRadius: 10, marginTop: 6,
  },

  // Composer
  composer: {
    display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 16px',
    paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(0deg, #161616, #111)', flexShrink: 0,
  },
  inputWrap: {
    flex: 1, background: '#222222', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 22, display: 'flex', alignItems: 'center', padding: '2px 6px',
  },
  textarea: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
    color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.45,
    padding: '10px', maxHeight: 120, overflowY: 'auto',
  },
  btnEnviar: {
    width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
    background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', transition: 'all .15s',
  },
  btnEnviarOn: { background: `linear-gradient(160deg, ${RED}, ${RED_DARK})`, color: '#fff', cursor: 'pointer', boxShadow: '0 8px 28px rgba(230,57,70,0.32)' },
}
