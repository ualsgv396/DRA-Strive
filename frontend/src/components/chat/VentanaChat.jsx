import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ContextoAuth'

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

function BurbujaMensaje({ mensaje, esMio }) {
  const navigate = useNavigate()

  const hora = new Date(mensaje.sentAt).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  if (mensaje.type === 'ROUTINE') {
    return (
      <div style={{ ...s.bubblewrap, justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
        <div style={{ ...s.routineCard, ...(esMio ? s.routineCardMio : s.routineCardSuyo) }}>
          <p style={s.routineLabel}>Rutina compartida</p>
          <p style={s.routineName}>
            {mensaje.routineNameSnapshot ?? 'Rutina eliminada'}
          </p>
          {mensaje.content && (
            <p style={s.routineNota}>{mensaje.content}</p>
          )}
          {mensaje.routineId && (
            <button
              onClick={() => navigate(`/rutina/${mensaje.routineId}`)}
              style={s.routineBtn}
            >
              Ver rutina →
            </button>
          )}
          <span style={s.hora}>{hora}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...s.bubblewrap, justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
      <div style={{ ...s.bubble, ...(esMio ? s.bubbleMio : s.bubbleSuyo) }}>
        <p style={s.bubbleTexto}>{mensaje.content}</p>
        <span style={s.hora}>{hora}</span>
      </div>
    </div>
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
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  // Scroll al último mensaje cada vez que llega uno nuevo
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Foco al abrir la ventana
  useEffect(() => {
    inputRef.current?.focus()
  }, [conversacionActiva])

  const handleEnviar = () => {
    if (!texto.trim()) return
    onEnviar(texto.trim())
    setTexto('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  if (!conversacionActiva) return null

  // eslint-disable-next-line — keyframe necesario para el spinner de carga

  const otroUsuario = conversacionActiva.otherUser

  return (
    <div style={s.overlay}>
      <div style={s.ventana}>

        {/* Header */}
        <header style={s.header}>
          <button onClick={onCerrar} style={s.btnVolver} aria-label="Cerrar chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={s.headerInfo}>
            <div style={s.avatar}>
              {(otroUsuario.fullName || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={s.headerNombre}>{otroUsuario.fullName}</p>
              {otroUsuario.nickname && (
                <p style={s.headerNick}>@{otroUsuario.nickname}</p>
              )}
            </div>
          </div>
        </header>

        {/* Área de mensajes */}
        <div style={s.mensajesArea}>
          {(() => {
            if (cargandoMensajes) {
              return (
                <div style={s.centrado}>
                  <div style={s.spinner} />
                </div>
              )
            }
            if (mensajes.length === 0) {
              return (
                <div style={s.centrado}>
                  <p style={s.vacioTexto}>Di hola 👋</p>
                  <p style={s.vacioSub}>Sois amigos — empieza la conversación</p>
                </div>
              )
            }
            return mensajes.map(m => (
              <BurbujaMensaje
                key={m.id}
                mensaje={m}
                esMio={m.senderId === usuario?.id}
              />
            ))
          })()}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={s.inputArea}>
          <textarea
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje…"
            rows={1}
            style={s.textarea}
          />
          <button
            onClick={handleEnviar}
            disabled={!texto.trim()}
            style={{ ...s.btnEnviar, ...(texto.trim() ? s.btnEnviarActivo : {}) }}
            aria-label="Enviar mensaje"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const RED = '#E63946'

const s = {
  overlay: {
    position:        'fixed',
    inset:           0,
    zIndex:          500,
    backgroundColor: '#0D0D0D',
    display:         'flex',
    flexDirection:   'column',
  },
  ventana: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    maxWidth:      '680px',
    width:         '100%',
    margin:        '0 auto',
    overflow:      'hidden',
  },

  // Header
  header: {
    display:         'flex',
    alignItems:      'center',
    gap:             '14px',
    padding:         '14px 16px',
    borderBottom:    '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#111',
    flexShrink:      0,
  },
  btnVolver: {
    background:   'none',
    border:       'none',
    color:        'rgba(255,255,255,0.6)',
    cursor:       'pointer',
    padding:      '4px',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '8px',
  },
  headerInfo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  avatar: {
    width:           '36px',
    height:          '36px',
    borderRadius:    '50%',
    backgroundColor: 'rgba(230,57,70,0.18)',
    color:           RED,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontFamily:      "'Oswald', sans-serif",
    fontWeight:      700,
    fontSize:        '16px',
    flexShrink:      0,
  },
  headerNombre: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize:   '15px',
    color:      '#fff',
    margin:     0,
  },
  headerNick: {
    fontFamily: "'Inter', sans-serif",
    fontSize:   '12px',
    color:      'rgba(255,255,255,0.4)',
    margin:     0,
  },

  // Área mensajes
  mensajesArea: {
    flex:       1,
    overflowY:  'auto',
    padding:    '16px 16px 8px',
    display:    'flex',
    flexDirection: 'column',
    gap:        '6px',
  },
  centrado: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    marginTop:      'auto',
    marginBottom:   'auto',
  },
  vacioTexto: {
    fontFamily: "'Oswald', sans-serif",
    fontSize:   '26px',
    color:      'rgba(255,255,255,0.55)',
    margin:     0,
  },
  vacioSub: {
    fontFamily: "'Inter', sans-serif",
    fontSize:   '13px',
    color:      'rgba(255,255,255,0.3)',
    margin:     0,
  },
  spinner: {
    width:       '28px',
    height:      '28px',
    border:      `3px solid rgba(230,57,70,0.25)`,
    borderTop:   `3px solid ${RED}`,
    borderRadius: '50%',
    animation:   'spin 0.7s linear infinite',
  },

  // Burbujas
  bubblewrap: {
    display:   'flex',
    width:     '100%',
  },
  bubble: {
    maxWidth:     '72%',
    padding:      '9px 13px',
    borderRadius: '16px',
    wordBreak:    'break-word',
  },
  bubbleMio: {
    backgroundColor: RED,
    borderBottomRightRadius: '4px',
  },
  bubbleSuyo: {
    backgroundColor: '#222',
    borderBottomLeftRadius: '4px',
  },
  bubbleTexto: {
    fontFamily: "'Inter', sans-serif",
    fontSize:   '14px',
    color:      '#fff',
    margin:     0,
    lineHeight: 1.45,
  },
  hora: {
    display:    'block',
    fontSize:   '10px',
    color:      'rgba(255,255,255,0.45)',
    marginTop:  '4px',
    textAlign:  'right',
  },

  // Tarjeta rutina
  routineCard: {
    maxWidth:     '80%',
    borderRadius: '16px',
    padding:      '12px 14px',
    display:      'flex',
    flexDirection: 'column',
    gap:          '4px',
    wordBreak:    'break-word',
  },
  routineCardMio: {
    backgroundColor:         'rgba(230,57,70,0.15)',
    border:                  '1px solid rgba(230,57,70,0.35)',
    borderBottomRightRadius: '4px',
  },
  routineCardSuyo: {
    backgroundColor:        '#1A1A1A',
    border:                 '1px solid rgba(255,255,255,0.10)',
    borderBottomLeftRadius: '4px',
  },
  routineLabel: {
    fontFamily:    "'Inter', sans-serif",
    fontSize:      '10px',
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color:         RED,
    margin:        0,
  },
  routineName: {
    fontFamily: "'Oswald', sans-serif",
    fontSize:   '16px',
    fontWeight: 700,
    color:      '#fff',
    margin:     0,
  },
  routineNota: {
    fontFamily: "'Inter', sans-serif",
    fontSize:   '13px',
    color:      'rgba(255,255,255,0.6)',
    margin:     0,
  },
  routineBtn: {
    background:    'none',
    border:        'none',
    color:         RED,
    fontFamily:    "'Inter', sans-serif",
    fontSize:      '13px',
    fontWeight:    600,
    cursor:        'pointer',
    padding:       0,
    textAlign:     'left',
    marginTop:     '4px',
  },

  // Input
  inputArea: {
    display:         'flex',
    alignItems:      'flex-end',
    gap:             '10px',
    padding:         '12px 16px 20px',
    borderTop:       '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#111',
    flexShrink:      0,
  },
  textarea: {
    flex:            1,
    backgroundColor: '#1E1E1E',
    border:          '1px solid rgba(255,255,255,0.12)',
    borderRadius:    '14px',
    padding:         '11px 14px',
    color:           '#fff',
    fontFamily:      "'Inter', sans-serif",
    fontSize:        '14px',
    resize:          'none',
    outline:         'none',
    lineHeight:      1.45,
    maxHeight:       '120px',
    overflowY:       'auto',
  },
  btnEnviar: {
    width:           '42px',
    height:          '42px',
    borderRadius:    '50%',
    border:          'none',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color:           'rgba(255,255,255,0.3)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          'not-allowed',
    flexShrink:      0,
    transition:      'all 0.15s',
  },
  btnEnviarActivo: {
    backgroundColor: RED,
    color:           '#fff',
    cursor:          'pointer',
  },
}
