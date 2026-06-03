import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useChat } from '../../hooks/useChat'

/**
 * Modal estilo WhatsApp para compartir una rutina con un amigo.
 *
 * Issue 3.1 → se abre al pulsar "Compartir" en Detalle de Rutina.
 * Issue 3.2 → carga la lista de amigos vía GET /friends (función ya existente).
 * Issue 3.3 → al pulsar un amigo emite un mensaje STOMP de tipo "ROUTINE"
 *             con el id de la rutina y el nombre como snapshot.
 *
 * Props:
 *   - rutina    : objeto con { id, name } como mínimo (el que ya carga DetalleRutina)
 *   - onCerrar  : callback cuando se cierra el modal
 */
export default function ModalCompartirRutina({ rutina, onCerrar }) {
  const { compartirRutinaConAmigo, conectado } = useChat()

  const [amigos,        setAmigos]        = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [busqueda,      setBusqueda]      = useState('')
  const [nota,          setNota]          = useState('')
  const [enviando,      setEnviando]      = useState(null)  // id del amigo al que se está enviando
  const [exito,         setExito]         = useState(null)  // nombre del amigo al que se envió
  const [error,         setError]         = useState('')

  useEffect(() => {
    api.get('/friends')
      .then(r => setAmigos(r.data ?? []))
      .catch(() => setError('No se pudieron cargar tus amigos'))
      .finally(() => setCargando(false))
  }, [])

  // Cierre con tecla Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  const amigosFiltrados = amigos.filter(a => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return (a.fullName ?? '').toLowerCase().includes(q)
        || (a.nickname ?? '').toLowerCase().includes(q)
  })

  const handleEnviar = async (amigo) => {
    if (enviando) return
    setError('')
    setEnviando(amigo.id)
    try {
      await compartirRutinaConAmigo(amigo.id, rutina.id, rutina.name, nota.trim())
      setExito(amigo.fullName)
      // Cierre automático tras 1.5s para que se vea la confirmación
      setTimeout(() => onCerrar(), 1500)
    } catch (e) {
      setError(e.message || 'No se pudo enviar la rutina')
      setEnviando(null)
    }
  }

  return (
    <div style={estilos.overlay} onClick={onCerrar}>
      <div style={estilos.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <header style={estilos.header}>
          <div>
            <p style={estilos.label}>Compartir rutina</p>
            <h3 style={estilos.titulo}>{rutina.name}</h3>
          </div>
          <button style={estilos.btnCerrar} onClick={onCerrar} aria-label="Cerrar">×</button>
        </header>

        {!conectado && (
          <div style={estilos.aviso}>
            Conectando con el chat… si tarda mucho, recarga la página.
          </div>
        )}

        {/* Confirmación de envío */}
        {exito && (
          <div style={estilos.exitoCard}>
            ✓ Rutina enviada a <strong>{exito}</strong>
          </div>
        )}

        {/* Nota opcional */}
        {!exito && (
          <div style={estilos.notaContenedor}>
            <input
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Añade una nota (opcional)…"
              maxLength={200}
              style={estilos.notaInput}
            />
          </div>
        )}

        {/* Buscador */}
        {!exito && (
          <div style={estilos.buscadorContenedor}>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar amigo…"
              style={estilos.buscador}
            />
          </div>
        )}

        {/* Lista de amigos */}
        {!exito && (
          <div style={estilos.lista}>
            {cargando && <p style={estilos.textoSuave}>Cargando amigos…</p>}
            {!cargando && error && <p style={estilos.errorTexto}>{error}</p>}
            {!cargando && !error && amigosFiltrados.length === 0 && (
              <p style={estilos.textoSuave}>
                {amigos.length === 0
                  ? 'Aún no tienes amigos a los que compartir.'
                  : 'Ningún amigo coincide con la búsqueda.'}
              </p>
            )}
            {!cargando && amigosFiltrados.map(amigo => {
              const estaEnviando = enviando === amigo.id
              return (
                <button
                  key={amigo.id}
                  onClick={() => handleEnviar(amigo)}
                  disabled={!conectado || enviando !== null}
                  style={{
                    ...estilos.itemAmigo,
                    ...(estaEnviando ? estilos.itemAmigoEnviando : {}),
                  }}
                >
                  <div style={estilos.avatar}>
                    {(amigo.fullName || '?')[0].toUpperCase()}
                  </div>
                  <div style={estilos.amigoInfo}>
                    <p style={estilos.amigoNombre}>{amigo.fullName}</p>
                    <p style={estilos.amigoNick}>@{amigo.nickname}</p>
                  </div>
                  <span style={estilos.itemAccion}>
                    {estaEnviando ? 'Enviando…' : 'Enviar →'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const RED = '#E63946'

const estilos = {
  overlay: {
    position:        'fixed',
    inset:           0,
    zIndex:          600,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display:         'flex',
    alignItems:      'flex-end',
    justifyContent:  'center',
    padding:         '0',
  },
  modal: {
    width:           '100%',
    maxWidth:        '520px',
    backgroundColor: '#111',
    borderTopLeftRadius:  '20px',
    borderTopRightRadius: '20px',
    padding:         '20px 20px 28px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '14px',
    maxHeight:       '85vh',
    border:          '1px solid rgba(255,255,255,0.06)',
  },
  header: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            '12px',
  },
  label: {
    fontFamily:     "'Inter', sans-serif",
    fontSize:       '11px',
    fontWeight:     700,
    textTransform:  'uppercase',
    letterSpacing:  '1.5px',
    color:          RED,
    margin:         0,
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize:   '22px',
    fontWeight: 700,
    color:      '#fff',
    margin:     '4px 0 0',
    textTransform: 'uppercase',
  },
  btnCerrar: {
    background:      'rgba(255,255,255,0.06)',
    border:          'none',
    borderRadius:    '50%',
    width:           '32px',
    height:          '32px',
    color:           'rgba(255,255,255,0.6)',
    fontSize:        '22px',
    lineHeight:      '1',
    cursor:          'pointer',
    flexShrink:      0,
  },
  aviso: {
    backgroundColor: 'rgba(255,210,0,0.08)',
    border:          '1px solid rgba(255,210,0,0.25)',
    color:           '#FFD200',
    borderRadius:    '10px',
    padding:         '8px 12px',
    fontSize:        '12px',
    fontFamily:      "'Inter', sans-serif",
  },
  exitoCard: {
    backgroundColor: 'rgba(78,205,196,0.10)',
    border:          '1px solid rgba(78,205,196,0.35)',
    color:           '#4ECDC4',
    borderRadius:    '12px',
    padding:         '14px 16px',
    fontSize:        '14px',
    fontFamily:      "'Inter', sans-serif",
    textAlign:       'center',
  },
  notaContenedor: { display: 'flex' },
  notaInput: {
    flex:            1,
    backgroundColor: '#1A1A1A',
    border:          '1px solid rgba(255,255,255,0.10)',
    borderRadius:    '10px',
    padding:         '10px 12px',
    color:           '#fff',
    fontFamily:      "'Inter', sans-serif",
    fontSize:        '13px',
    outline:         'none',
  },
  buscadorContenedor: { display: 'flex' },
  buscador: {
    flex:            1,
    backgroundColor: '#1A1A1A',
    border:          '1px solid rgba(255,255,255,0.10)',
    borderRadius:    '10px',
    padding:         '10px 12px',
    color:           '#fff',
    fontFamily:      "'Inter', sans-serif",
    fontSize:        '13px',
    outline:         'none',
  },
  lista: {
    overflowY:     'auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    paddingRight:  '2px',
  },
  textoSuave: {
    fontFamily: "'Inter', sans-serif",
    color:      'rgba(255,255,255,0.4)',
    fontSize:   '13px',
    textAlign:  'center',
    padding:    '12px',
    margin:     0,
  },
  errorTexto: {
    fontFamily: "'Inter', sans-serif",
    color:      RED,
    fontSize:   '13px',
    textAlign:  'center',
    padding:    '12px',
    margin:     0,
  },
  itemAmigo: {
    display:         'flex',
    alignItems:      'center',
    gap:             '12px',
    padding:         '10px 12px',
    backgroundColor: '#1A1A1A',
    border:          '1px solid rgba(255,255,255,0.06)',
    borderRadius:    '12px',
    cursor:          'pointer',
    textAlign:       'left',
    color:           '#fff',
    fontFamily:      "'Inter', sans-serif",
    transition:      'background 0.15s, border-color 0.15s',
  },
  itemAmigoEnviando: {
    backgroundColor: 'rgba(230,57,70,0.10)',
    borderColor:     'rgba(230,57,70,0.30)',
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
  amigoInfo: { flex: 1, minWidth: 0 },
  amigoNombre: {
    margin:     0,
    fontSize:   '14px',
    fontWeight: 600,
    color:      '#fff',
    overflow:   'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  amigoNick: {
    margin:    0,
    fontSize:  '11px',
    color:     'rgba(255,255,255,0.4)',
  },
  itemAccion: {
    fontSize:   '12px',
    fontWeight: 600,
    color:      RED,
    flexShrink: 0,
  },
}
