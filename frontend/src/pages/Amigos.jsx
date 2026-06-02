import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useChat } from '../hooks/useChat'
import VentanaChat from '../components/chat/VentanaChat'

export default function Amigos() {
  const location = useLocation()
  const chat     = useChat()

  const [busqueda, setBusqueda] = useState('')
  const [amigos, setAmigos] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [resultados, setResultados] = useState([])
  const [invitacion, setInvitacion] = useState(null)
  const [procesandoInvitacion, setProcesandoInvitacion] = useState(false)
  const [estadoBusqueda, setEstadoBusqueda] = useState('')
  const [enlaceCopiado, setEnlaceCopiado] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
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
      <main style={estilos.main}>
        <header style={estilos.encabezado}>
          <span style={estilos.kicker}>CONEXIONES</span>
          <h1 style={estilos.titulo}>Amigos</h1>
          <p style={estilos.subtitulo}>
            Busca por nickname o comparte un QR/enlace para conectar al instante.
          </p>
        </header>

        <section style={estilos.bloqueBusqueda}>
          <label style={estilos.label}>Buscar por nickname</label>
          <div style={estilos.filaBusqueda}>
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="@nickname"
              style={estilos.input}
            />
            <button style={estilos.botonPrimario} onClick={buscarUsuarios}>Buscar</button>
          </div>
          {busqueda.trim() && (
            <div style={estilos.resultados}>
              {estadoBusqueda && <p style={estilos.textoSuave}>{estadoBusqueda}</p>}
              {!estadoBusqueda && resultados.length === 0 && (
                <p style={estilos.textoSuave}>No encontramos usuarios con ese nickname.</p>
              )}
              {resultados.map((usuario) => (
                <div key={usuario.id} style={estilos.itemResultado}>
                  <div>
                    <p style={estilos.nombre}>{usuario.fullName}</p>
                    <p style={estilos.nickname}>@{usuario.nickname}</p>
                  </div>
                  {usuario.relation === 'NONE' && (
                    <button style={estilos.botonSecundario} onClick={() => enviarSolicitud(usuario.id)}>
                      Agregar
                    </button>
                  )}
                  {usuario.relation !== 'NONE' && (
                    <span style={estilos.textoSuave}>{traducirRelacion(usuario.relation)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={estilos.gridOpciones}>
          <article style={estilos.tarjeta}>
            <h2 style={estilos.tarjetaTitulo}>Compartir QR</h2>
            {!invitacion && (
              <button style={estilos.botonPrimario} onClick={generarInvitacion}>Generar QR</button>
            )}
            {invitacion?.qrImageBase64 && (
              <img
                src={`data:image/png;base64,${invitacion.qrImageBase64}`}
                alt="QR de invitacion"
                style={estilos.qrReal}
              />
            )}
            <p style={estilos.textoSuave}>Muestra este QR para hacerse amigos automaticamente.</p>
          </article>

          <article style={estilos.tarjeta}>
            <h2 style={estilos.tarjetaTitulo}>Enlace de invitacion</h2>
            <div style={estilos.enlaceBox}>
              <span style={estilos.enlaceTexto}>
                {invitacion?.inviteUrl || 'Genera primero una invitacion'}
              </span>
              <button style={estilos.botonPrimario} onClick={copiarEnlace}>
                {enlaceCopiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={estilos.textoSuave}>Comparte tu enlace y la amistad se crea en un toque.</p>
          </article>
        </section>

        <section style={estilos.lista}>
          <h2 style={estilos.tarjetaTitulo}>Solicitudes pendientes ({solicitudes.length})</h2>
          <div style={estilos.listaItems}>
            {solicitudes.map((solicitud) => (
              <div key={solicitud.requestId} style={estilos.itemAmigo}>
                <div>
                  <p style={estilos.nombre}>{solicitud.fromUser.fullName}</p>
                  <p style={estilos.nickname}>@{solicitud.fromUser.nickname}</p>
                </div>
                <button style={estilos.botonSecundario} onClick={() => aceptarSolicitud(solicitud.requestId)}>
                  Aceptar
                </button>
              </div>
            ))}
            {solicitudes.length === 0 && <p style={estilos.textoSuave}>No hay solicitudes por ahora.</p>}
          </div>
        </section>

        <section style={estilos.lista}>
          <h2 style={estilos.tarjetaTitulo}>Mis amigos ({amigos.length})</h2>
          <div style={estilos.listaItems}>
            {amigos.map((amigo) => (
              <div key={amigo.id} style={estilos.itemAmigo}>
                <div>
                  <p style={estilos.nombre}>{amigo.fullName}</p>
                  <p style={estilos.nickname}>@{amigo.nickname}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ ...estilos.estado, ...estilos.enLinea }}>Amigo</span>
                  <button
                    style={estilos.botonChat}
                    onClick={() => chat.abrirConversacion(amigo.id)}
                    aria-label={`Chatear con ${amigo.fullName}`}
                  >
                    💬
                  </button>
                </div>
              </div>
            ))}
            {amigos.length === 0 && <p style={estilos.textoSuave}>Aun no tienes amigos agregados.</p>}
          </div>
        </section>
        {procesandoInvitacion && <p style={estilos.textoSuave}>Procesando invitacion...</p>}
        {mensaje && <p style={estilos.mensaje}>{mensaje}</p>}
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

const estilos = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    paddingBottom: '104px'
  },
  main: {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '36px 20px 0'
  },
  encabezado: { marginBottom: '22px' },
  kicker: {
    color: '#E63946',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    fontFamily: "'Inter', sans-serif"
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '46px',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: "'Inter', sans-serif"
  },
  bloqueBusqueda: {
    backgroundColor: '#151515',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '18px',
    marginBottom: '18px'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  filaBusqueda: { display: 'flex', gap: '10px' },
  input: {
    flex: 1,
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.14)',
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    padding: '12px 14px',
    fontSize: '14px'
  },
  botonPrimario: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    fontWeight: 700,
    padding: '0 18px',
    minHeight: '44px'
  },
  botonSecundario: {
    border: '1px solid rgba(230,57,70,0.45)',
    backgroundColor: 'rgba(230,57,70,0.12)',
    color: '#FFFFFF',
    borderRadius: '10px',
    fontWeight: 600,
    minHeight: '38px',
    padding: '0 14px'
  },
  resultados: { marginTop: '14px', display: 'grid', gap: '8px' },
  itemResultado: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gridOpciones: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '14px',
    marginBottom: '18px'
  },
  tarjeta: {
    backgroundColor: '#151515',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '18px'
  },
  tarjetaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '25px',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  qrReal: {
    width: '132px',
    height: '132px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    padding: '8px',
    marginBottom: '12px'
  },
  enlaceBox: {
    backgroundColor: '#1D1D1D',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px'
  },
  enlaceTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  lista: {
    backgroundColor: '#151515',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '18px'
  },
  listaItems: { display: 'grid', gap: '8px' },
  itemAmigo: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nombre: {
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif"
  },
  nickname: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px'
  },
  textoSuave: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '13px',
    lineHeight: 1.5
  },
  estado: {
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  enLinea: {
    color: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.15)'
  },
  desconectado: {
    color: '#A1A1AA',
    backgroundColor: 'rgba(161,161,170,0.15)'
  },
  mensaje: {
    marginTop: '12px',
    color: '#E63946',
    fontSize: '13px'
  },
  botonChat: {
    border:          'none',
    background:      'rgba(230,57,70,0.12)',
    borderRadius:    '10px',
    padding:         '6px 10px',
    fontSize:        '16px',
    cursor:          'pointer',
    lineHeight:      1,
    transition:      'background 0.15s',
  }
}
