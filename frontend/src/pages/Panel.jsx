import { useAuth } from '../context/ContextoAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Panel() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarRutinas = async () => {
      if (!usuario?.id) {
        setCargando(false)
        return
      }

      try {
        const respuesta = await api.get(`/routines?ownerId=${usuario.id}`)
        setRutinas(respuesta.data)
      } catch (err) {
        console.error('Error cargando rutinas:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarRutinas()
  }, [usuario?.id])

  const manejarCerrarSesion = () => {
    cerrarSesion()
    navigate('/')
  }

  return (
    <div style={estilos.contenedor}>

      {/* NAVBAR */}
      <nav style={estilos.navbar}>
        <span style={estilos.logo}>STRIVE</span>
        <div style={estilos.navLinks}>
          <button style={estilos.navLink} onClick={() => navigate('/ejercicios')}>
            Ejercicios
          </button>
          <button style={estilos.navLink} onClick={() => navigate('/panel')}>
            Mis rutinas
          </button>
        </div>
        <div style={estilos.navDerecha}>
          <span style={estilos.nombreUsuario}>Hola, {usuario?.nombre}</span>
          <button style={estilos.botonSalir} onClick={manejarCerrarSesion}>
            Salir
          </button>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main style={estilos.main}>

        {/* Cabecera */}
        <div style={estilos.cabecera}>
          <div>
            <h1 style={estilos.titulo}>Mis rutinas</h1>
            <p style={estilos.subtitulo}>
              {rutinas.length === 0
                ? 'Aún no tienes rutinas. ¡Crea tu primera!'
                : `Tienes ${rutinas.length} rutina${rutinas.length > 1 ? 's' : ''} creada${rutinas.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button style={estilos.botonNueva} onClick={() => navigate('/rutina/nueva')}>
            + Nueva rutina
          </button>
        </div>

        {/* Estado de carga */}
        {cargando && (
          <div style={estilos.estadoCentro}>
            <p style={estilos.textoCentro}>Cargando rutinas...</p>
          </div>
        )}

        {/* Sin rutinas */}
        {!cargando && rutinas.length === 0 && (
          <div style={estilos.vacio}>
            <span style={estilos.vaciIcono}>💪</span>
            <h3 style={estilos.vacioTitulo}>Todavía no hay nada aquí</h3>
            <p style={estilos.vacioTexto}>Crea tu primera rutina y empieza a entrenar</p>
            <button style={estilos.botonCrear} onClick={() => navigate('/rutina/nueva')}>
              Crear mi primera rutina
            </button>
          </div>
        )}

        {/* Grid de rutinas */}
        {!cargando && rutinas.length > 0 && (
          <div style={estilos.grid}>
            {rutinas.map((rutina) => (
              <div
                key={rutina.id}
                style={estilos.tarjeta}
                onClick={() => navigate(`/rutina/${rutina.id}`)}
              >
                <div style={estilos.tarjetaAccento}></div>
                <div style={estilos.tarjetaContenido}>
                  <h3 style={estilos.tarjetaTitulo}>{rutina.name}</h3>
                  <p style={estilos.tarjetaDescripcion}>
                    {rutina.goal || 'Sin descripción'}
                  </p>
                  <div style={estilos.tarjetaPie}>
                    <span style={estilos.tarjetaBadge}>
                      {rutina.routineExercises?.length || 0} ejercicios
                    </span>
                    <span style={estilos.tarjetaFecha}>
                      {new Date(rutina.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ACCESO RÁPIDO */}
      <div style={estilos.accesoRapido}>
        <button style={estilos.botonRapido} onClick={() => navigate('/ejercicios')}>
          <span style={estilos.botonRapidoIcono}>🏋️</span>
          <span>Ver ejercicios</span>
        </button>
        <button style={estilos.botonRapido} onClick={() => navigate('/rutina/nueva')}>
          <span style={estilos.botonRapidoIcono}>➕</span>
          <span>Nueva rutina</span>
        </button>
      </div>

    </div>
  )
}

const estilos = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#111111'
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '24px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E63946',
    letterSpacing: '2px'
  },
  navLinks: {
    display: 'flex',
    gap: '8px'
  },
  navLink: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  navDerecha: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  nombreUsuario: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: "'Inter', sans-serif"
  },
  botonSalir: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer'
  },
  main: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  cabecera: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px'
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '42px',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  subtitulo: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif"
  },
  botonNueva: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer'
  },
  estadoCentro: {
    textAlign: 'center',
    padding: '80px 0'
  },
  textoCentro: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Inter', sans-serif"
  },
  vacio: {
    textAlign: 'center',
    padding: '80px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  vaciIcono: {
    fontSize: '64px'
  },
  vacioTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '28px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  vacioTexto: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif"
  },
  botonCrear: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '8px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  },
  tarjeta: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    transition: 'transform 0.2s'
  },
  tarjetaAccento: {
    width: '4px',
    backgroundColor: '#E63946',
    flexShrink: 0
  },
  tarjetaContenido: {
    padding: '24px',
    flex: 1
  },
  tarjetaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '20px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  tarjetaDescripcion: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '20px',
    lineHeight: '1.5'
  },
  tarjetaPie: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tarjetaBadge: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    color: '#E63946',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif"
  },
  tarjetaFecha: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: "'Inter', sans-serif"
  },
  accesoRapido: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  botonRapido: {
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '50px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  },
  botonRapidoIcono: {
    fontSize: '18px'
  }
}