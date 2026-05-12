import { useAuth } from '../context/ContextoAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import CronometroRegresivo from '../components/flash/CronometroRegresivo'
import { useResponsive } from '../hooks/useMediaQuery'
import BotonCerrarSesion from '../components/layout/BotonCerrarSesion'

export default function Panel() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useResponsive()
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)

  // Insert optimista: la tarjeta flash aparece antes de que la API responda
  useEffect(() => {
    const nuevaRutina = location.state?.nuevaRutina
    if (!nuevaRutina) return
    setRutinas(prev =>
      prev.some(r => r.id === nuevaRutina.id) ? prev : [nuevaRutina, ...prev]
    )
    window.history.replaceState({}, '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cargarRutinas = async () => {
      if (!usuario?.id) { setCargando(false); return }
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

  const eliminarDeVista = (id) =>
    setRutinas(prev => prev.filter(r => r.id !== id))

  const rutinasFlash = rutinas.filter(r => r.flash)
  const rutinasNormales = rutinas.filter(r => !r.flash)

  return (
    <div style={s.contenedor}>

      <nav style={{ ...s.navbar, padding: isMobile ? '14px 20px' : '20px 40px' }}>
        <span style={s.logo}>STRIVE</span>

        {/* Nav links solo en escritorio */}
        {!isMobile && (
          <div style={s.navLinks}>
            <button style={s.navLink} onClick={() => navigate('/ejercicios')}>Ejercicios</button>
            <button style={s.navLink} onClick={() => navigate('/panel')}>Mis rutinas</button>
            <button style={s.navLink} onClick={() => navigate('/historial')}>Historial</button>
          </div>
        )}

        <div style={s.navDerecha}>
          {!isMobile && (
            <span style={s.nombreUsuario}>Hola, {usuario?.nombre}</span>
          )}
          <BotonCerrarSesion />
        </div>
      </nav>

      <main style={{ ...s.main, padding: isMobile ? '24px 16px' : '40px' }}>

        <div style={{
          ...s.cabecera,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: isMobile ? '28px' : '40px',
        }}>
          <div>
            <h1 style={{ ...s.titulo, fontSize: isMobile ? '32px' : '42px' }}>
              Mis rutinas
            </h1>
            <p style={s.subtitulo}>
              {rutinas.length === 0
                ? 'Aún no tienes rutinas. ¡Crea tu primera!'
                : `Tienes ${rutinas.length} rutina${rutinas.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{
            ...s.acciones,
            width: isMobile ? '100%' : 'auto',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <button
              style={{ ...s.botonFlash, width: isMobile ? '100%' : 'auto' }}
              onClick={() => navigate('/flash-training')}
            >
              ⚡ Flash Training
            </button>
            <button
              style={{ ...s.botonNueva, width: isMobile ? '100%' : 'auto' }}
              onClick={() => navigate('/rutina/nueva')}
            >
              + Nueva rutina
            </button>
          </div>
        </div>

        {cargando && (
          <div style={s.estadoCentro}>
            <p style={s.textoCentro}>Cargando rutinas...</p>
          </div>
        )}

        {!cargando && rutinas.length === 0 && (
          <div style={s.vacio}>
            <span style={s.vaciIcono}>💪</span>
            <h3 style={s.vacioTitulo}>Todavía no hay nada aquí</h3>
            <p style={s.vacioTexto}>Crea tu primera rutina o genera un Flash Training</p>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto',
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <button
                style={{ ...s.botonFlash, width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/flash-training')}
              >
                ⚡ Flash Training
              </button>
              <button
                style={{ ...s.botonCrear, width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/rutina/nueva')}
              >
                Crear rutina normal
              </button>
            </div>
          </div>
        )}

        {/* Sección Flash Training */}
        {!cargando && rutinasFlash.length > 0 && (
          <div style={s.seccionFlash}>
            <div style={s.seccionHeader}>
              <span style={s.seccionIcono}>⚡</span>
              <h2 style={s.seccionTitulo}>Flash Training activos</h2>
            </div>
            <div style={{ ...s.grid, gap: isMobile ? '16px' : '24px' }}>
              {rutinasFlash.map(rutina => (
                <TarjetaFlash
                  key={rutina.id}
                  rutina={rutina}
                  onClick={() => navigate(`/rutina/${rutina.id}`)}
                  onExpire={() => eliminarDeVista(rutina.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rutinas normales */}
        {!cargando && rutinasNormales.length > 0 && (
          <>
            {rutinasFlash.length > 0 && (
              <h2 style={s.seccionTituloNormal}>Rutinas guardadas</h2>
            )}
            <div style={{ ...s.grid, gap: isMobile ? '16px' : '24px' }}>
              {rutinasNormales.map(rutina => (
                <div
                  key={rutina.id}
                  style={s.tarjeta}
                  onClick={() => navigate(`/rutina/${rutina.id}`)}
                >
                  <div style={s.tarjetaAccento} />
                  <div style={s.tarjetaContenido}>
                    <h3 style={s.tarjetaTitulo}>{rutina.name}</h3>
                    <p style={s.tarjetaDescripcion}>{rutina.goal || 'Sin descripción'}</p>
                    <div style={s.tarjetaPie}>
                      <span style={s.tarjetaBadge}>
                        {rutina.routineExercises?.length || 0} ejercicios
                      </span>
                      <span style={s.tarjetaFecha}>
                        {new Date(rutina.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

    </div>
  )
}

// ─── Tarjeta Flash ────────────────────────────────────────────────────────────
function TarjetaFlash({ rutina, onClick, onExpire }) {
  return (
    <div style={s.tarjetaFlash} onClick={onClick}>
      <div style={s.flashBarra} />
      <div style={s.tarjetaContenido}>
        <div style={s.flashCabecera}>
          <span style={s.flashBadge}>⚡ FLASH</span>
          <div style={s.cronometroWrap}>
            <span style={s.cronometroLabel}>Expira en</span>
            <CronometroRegresivo
              expiresAt={rutina.flashExpiresAt}
              onExpire={onExpire}
            />
          </div>
        </div>
        <h3 style={s.tarjetaTitulo}>{rutina.name}</h3>
        <p style={s.tarjetaDescripcion}>{rutina.goal || 'Sin descripción'}</p>
        <div style={s.tarjetaPie}>
          <span style={{ ...s.tarjetaBadge, ...s.flashBadgeCount }}>
            {rutina.routineExercises?.length || 0} ejercicios
          </span>
          <span style={s.tarjetaFecha}>
            {new Date(rutina.createdAt).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    paddingBottom: 'calc(var(--bottom-nav-h) + 24px)',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#111111',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '24px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E63946',
    letterSpacing: '2px',
    userSelect: 'none',
  },
  navLinks: { display: 'flex', gap: '8px' },
  navLink: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  navDerecha: { display: 'flex', alignItems: 'center', gap: '16px' },
  nombreUsuario: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: "'Inter', sans-serif",
  },
  main: { maxWidth: '1200px', margin: '0 auto' },
  cabecera: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  subtitulo: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif",
  },
  acciones: { display: 'flex', gap: '12px' },
  botonFlash: {
    background: 'linear-gradient(90deg, #FF8C42, #FF4D4D)',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(255,140,66,0.25)',
    minHeight: '50px',
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
    cursor: 'pointer',
    minHeight: '50px',
  },
  estadoCentro: { textAlign: 'center', padding: '80px 0' },
  textoCentro: { color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" },
  vacio: {
    textAlign: 'center',
    padding: '80px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  vaciIcono: { fontSize: '64px' },
  vacioTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '28px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vacioTexto: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif",
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
    minHeight: '50px',
  },
  seccionFlash: { marginBottom: '48px' },
  seccionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  seccionIcono: { fontSize: '20px' },
  seccionTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '18px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#FF8C42',
  },
  seccionTituloNormal: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '18px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  },
  // ── Tarjeta normal ──
  tarjeta: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    transition: 'transform 0.2s',
  },
  tarjetaAccento: { width: '4px', backgroundColor: '#E63946', flexShrink: 0 },
  tarjetaContenido: { padding: '24px', flex: 1 },
  tarjetaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '20px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  tarjetaDescripcion: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  tarjetaPie: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tarjetaBadge: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    color: '#E63946',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
  },
  tarjetaFecha: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: "'Inter', sans-serif",
  },
  // ── Tarjeta Flash ──
  tarjetaFlash: {
    background: 'linear-gradient(135deg, #1a0a05 0%, #111 55%, #0a0a1a 100%)',
    border: '1px solid rgba(255,140,66,0.35)',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 24px rgba(255,140,66,0.1)',
    transition: 'box-shadow 0.2s',
  },
  flashBarra: {
    height: '3px',
    background: 'linear-gradient(90deg, #FF8C42, #FF4D4D, #FF8C42)',
    flexShrink: 0,
  },
  flashCabecera: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  flashBadge: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #FF8C42, #FF4D4D)',
    color: '#fff',
    fontSize: '10px',
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '700',
    letterSpacing: '1.5px',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  cronometroWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  cronometroLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.35)',
    fontFamily: "'Inter', sans-serif",
  },
  flashBadgeCount: {
    backgroundColor: 'rgba(255,140,66,0.15)',
    color: '#FF8C42',
  },
}
