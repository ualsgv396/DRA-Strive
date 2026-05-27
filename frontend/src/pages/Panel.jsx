import { useAuth } from '../context/ContextoAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import api from '../api/axios'
import CronometroRegresivo from '../components/flash/CronometroRegresivo'
import { useResponsive } from '../hooks/useMediaQuery'
import BotonCerrarSesion from '../components/layout/BotonCerrarSesion'
import TarjetaRutina from '../components/rutina/TarjetaRutina'

export default function Panel() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useResponsive()
  const [rutinas, setRutinas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sesionActiva, setSesionActiva] = useState(null)
  const [sesionesRecientes, setSesionesRecientes] = useState([])
  const [metaSemanal, setMetaSemanal] = useState(null)

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
    api.get('/training-sessions?limit=14')
      .then(r => {
        const data = r.data ?? []
        setSesionActiva(data.find(s => s.status === 'STARTED') ?? null)
        setSesionesRecientes(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!usuario?.id) return
    try {
      const meta = localStorage.getItem(`strive_meta_semanal_${usuario.id}`)
      if (meta) setMetaSemanal(JSON.parse(meta))
    } catch { /* ignore */ }
  }, [usuario?.id])

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

  const diasEstaSemana = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const dow = d.getDay()
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    const lunes = d
    return new Set(
      sesionesRecientes
        .filter(s => s.status === 'COMPLETED' && new Date(s.completedAt ?? s.startedAt) >= lunes)
        .map(s => new Date(s.completedAt ?? s.startedAt).toISOString().split('T')[0])
    ).size
  }, [sesionesRecientes])

  const [busqueda, setBusqueda] = useState('')
  const rutinasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? rutinasNormales.filter(r => r.name?.toLowerCase().includes(q)) : rutinasNormales
  }, [rutinasNormales, busqueda])

  return (
    <div style={s.contenedor}>

      <nav style={{ ...s.navbar, padding: isMobile ? '14px 20px' : '16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={s.logo}>STRIVE</span>

          {/* Nav links solo en escritorio */}
          {!isMobile && (
            <div style={s.navLinks}>
              <button style={s.navLinkActive} onClick={() => navigate('/panel')}>Mis rutinas</button>
              <button style={s.navLink} onClick={() => navigate('/ejercicios')}>Ejercicios</button>
              <button style={s.navLink} onClick={() => navigate('/historial')}>Historial</button>
            </div>
          )}
        </div>

        <div style={s.navDerecha}>
          {!isMobile && (
            <span style={s.nombreUsuario}>Hola, {usuario?.nombre}</span>
          )}
          <BotonCerrarSesion />
        </div>
      </nav>

      <main style={{ ...s.main, padding: isMobile ? '24px 16px' : '32px 40px' }}>

        {/* Banner sesión activa */}
        <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(230,57,70,0.25)} 50%{box-shadow:0 0 0 5px rgba(230,57,70,0.45)} }`}</style>
        {sesionActiva && (
          <button
            onClick={() => navigate(`/entrenamiento/${sesionActiva.id}`)}
            style={{
              ...s.bannerSesion,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 12 : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={s.pulseDot} />
              <div style={{ textAlign: 'left' }}>
                <p style={s.bannerEtiqueta}>Entrenamiento en curso</p>
                <p style={s.bannerNombre}>{sesionActiva.routineName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: isMobile ? 0 : 'auto' }}>
              <span style={s.bannerHora}>
                Iniciado a las {new Date(sesionActiva.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={s.bannerCta}>Continuar →</span>
            </div>
          </button>
        )}

        {/* Strip meta semanal */}
        {metaSemanal && (
          <div style={s.metaStrip}>
            <div style={s.metaInfo}>
              <span style={s.metaTexto}>Meta semanal</span>
              <span style={s.metaConteo}>
                <span style={{ color: diasEstaSemana >= metaSemanal ? '#4ECDC4' : '#fff' }}>{diasEstaSemana}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}> / {metaSemanal}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i < diasEstaSemana ? '#E63946' : 'rgba(255,255,255,0.10)',
                    transition: 'background-color 0.2s',
                  }}
                />
              ))}
            </div>
            {diasEstaSemana >= metaSemanal && (
              <span style={s.metaOk}>✓</span>
            )}
          </div>
        )}

        <div style={{
          ...s.cabecera,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          marginBottom: isMobile ? '24px' : '28px',
        }}>
          <div>
            <span style={s.eyebrow}>Panel</span>
            <h1 style={{ ...s.titulo, fontSize: isMobile ? '32px' : '42px' }}>
              Mis rutinas
            </h1>
            <p style={s.subtitulo}>
              {rutinas.length === 0
                ? 'Aún no tienes rutinas. ¡Crea tu primera!'
                : <>Tienes <strong style={{ color: '#fff', fontWeight: 600 }}>{rutinas.length} rutina{rutinas.length > 1 ? 's' : ''}</strong></>}
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
              <span style={s.seccionIconWrap}>⚡</span>
              <h2 style={s.seccionTitulo}>Flash Training activos</h2>
              <span style={s.seccionRule} />
            </div>
            <div style={{ ...s.grid, gap: isMobile ? '16px' : '20px' }}>
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

        {/* Buscador de rutinas */}
        {!cargando && rutinasNormales.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="search"
              placeholder="Buscar rutina..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '10px',
                padding: '0 16px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Rutinas normales */}
        {!cargando && rutinasNormales.length > 0 && (
          <>
            {rutinasFlash.length > 0 && (
              <div style={s.seccionHeader}>
                <h2 style={s.seccionTituloNormal}>Rutinas guardadas</h2>
                <span style={s.seccionRule} />
              </div>
            )}
            {rutinasFiltradas.length > 0 ? (
              <div style={{ ...s.grid, gap: isMobile ? '16px' : '20px' }}>
                {rutinasFiltradas.map(rutina => (
                  <TarjetaRutina
                    key={rutina.id}
                    rutina={rutina}
                    onClick={() => navigate(`/rutina/${rutina.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', fontFamily: "'Inter', sans-serif", textAlign: 'center', padding: '40px 0' }}>
                No se encontraron rutinas con ese nombre
              </p>
            )}
          </>
        )}

      </main>

    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

// ─── Tarjeta Flash ────────────────────────────────────────────────────────────
function TarjetaFlash({ rutina, onClick, onExpire }) {
  return (
    <div className="card-press" style={s.tarjetaFlash} onClick={onClick}>
      <span style={s.flashTopStrip} />
      <div style={s.tarjetaContenidoFlash}>
        <div style={s.flashCabecera}>
          <div>
            <span style={s.flashBadge}>
              <span style={{ marginRight: 4 }}>⚡</span>FLASH
            </span>
            <h3 style={{ ...s.tarjetaTitulo, marginTop: 10 }}>{rutina.name}</h3>
            <p style={s.tarjetaDescripcion}>{rutina.goal || 'Sin descripción'}</p>
          </div>
          <div style={s.cronometroWrap}>
            <span style={s.cronometroLabel}>Expira en</span>
            <CronometroRegresivo
              expiresAt={rutina.flashExpiresAt}
              onExpire={onExpire}
              estiloTexto={s.cronometroBig}
            />
          </div>
        </div>
        <div style={s.tarjetaStatsFlash}>
          <Stat label="Ejercicios" value={String(rutina.routineExercises?.length || 0).padStart(2, '0')} />
          <div>
            <div style={{ ...s.statValue, color: '#FFB37A' }}>Flash</div>
            <div style={s.statLabel}>Modo</div>
          </div>
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
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(15,15,15,0.86)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '22px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E63946',
    letterSpacing: '2px',
    userSelect: 'none',
  },
  navLinks: { display: 'flex', gap: '4px' },
  navLink: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  navLinkActive: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    padding: '8px 14px',
    boxShadow: 'inset 0 -2px 0 #E63946',
    cursor: 'pointer',
  },
  navDerecha: { display: 'flex', alignItems: 'center', gap: '16px' },
  nombreUsuario: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: "'Inter', sans-serif",
  },
  main: { maxWidth: '1280px', margin: '0 auto' },

  cabecera: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'space-between',
  },
  eyebrow: {
    display: 'inline-block',
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px', fontWeight: 600,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '999px',
    background: 'rgba(230,57,70,0.10)',
    color: '#FF6B7A',
    border: '1px solid rgba(230,57,70,0.30)',
    marginBottom: '12px',
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 6px',
    background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.55) 130%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  subtitulo: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  acciones: { display: 'flex', gap: '10px' },

  botonFlash: {
    background: 'linear-gradient(90deg, #FF8C42 0%, #FF4D4D 100%)',
    color: '#FFFFFF',
    border: '1px solid transparent',
    padding: '0 20px',
    height: '46px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(255,140,66,0.35), 0 0 0 1px rgba(255,140,66,0.45)',
  },
  botonNueva: {
    background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
    color: '#FFFFFF',
    border: '1px solid rgba(230,57,70,0.85)',
    padding: '0 20px',
    height: '46px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.20), 0 8px 22px rgba(230,57,70,0.32)',
  },

  estadoCentro: { textAlign: 'center', padding: '80px 0' },
  textoCentro: { color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" },

  vacio: {
    textAlign: 'center',
    padding: '64px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  vaciIcono: { fontSize: '56px', opacity: 0.75 },
  vacioTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '26px',
    fontWeight: 600,
    textTransform: 'uppercase',
    margin: 0,
  },
  vacioTexto: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },
  botonCrear: {
    background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
    color: '#FFFFFF',
    border: '1px solid rgba(230,57,70,0.85)',
    padding: '0 28px',
    height: '46px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 22px rgba(230,57,70,0.32)',
  },

  seccionFlash: { marginBottom: '36px' },
  seccionHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '16px',
  },
  seccionIconWrap: {
    fontSize: '14px',
    width: 22, height: 22, borderRadius: '50%',
    background: 'rgba(255,140,66,0.12)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: '#FFB37A',
  },
  seccionTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#FFB37A',
    margin: 0,
  },
  seccionTituloNormal: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
  },
  seccionRule: {
    flex: 1, height: 1,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.10), transparent)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },

  // ── Estilos compartidos con TarjetaFlash ──
  tarjetaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '22px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 4px',
  },
  tarjetaDescripcion: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
    margin: 0,
  },
  statValue: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '20px',
    lineHeight: 1,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    marginTop: 4,
    fontSize: '9px',
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
  },

  // ── Tarjeta Flash ──
  tarjetaFlash: {
    position: 'relative',
    background: `
      radial-gradient(120% 80% at 0% 0%, rgba(255,140,66,0.18), transparent 55%),
      radial-gradient(120% 80% at 100% 100%, rgba(230,57,70,0.16), transparent 55%),
      linear-gradient(180deg, #1a0e08, #0f0d0e)
    `,
    border: '1px solid rgba(255,140,66,0.30)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 8px 28px rgba(255,140,66,0.34), 0 1px 0 rgba(255,255,255,0.04) inset',
  },
  flashTopStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    background: 'linear-gradient(90deg, transparent, #FF8C42, #FF4D4D, #FF8C42, transparent)',
  },
  tarjetaContenidoFlash: {
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  flashCabecera: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  },
  flashBadge: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #FF8C42, #FF4D4D)',
    color: '#fff',
    fontSize: '10px',
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    letterSpacing: '1.5px',
    padding: '3px 10px',
    borderRadius: '999px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
  },
  cronometroWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  cronometroLabel: {
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    fontSize: '9px',
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: 'rgba(255,179,122,0.7)',
  },
  cronometroBig: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    fontSize: '22px',
    color: '#FFB37A',
    lineHeight: 1,
    textShadow: '0 0 14px rgba(255,140,66,0.5)',
  },
  tarjetaStatsFlash: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,140,66,0.18)',
  },

  // ── Meta semanal strip ──
  metaStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    padding: '10px 16px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 90,
  },
  metaTexto: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
  metaConteo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  metaOk: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#4ECDC4',
    flexShrink: 0,
  },

  // ── Banner sesión activa ──
  bannerSesion: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '28px',
    padding: '14px 20px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(230,57,70,0.10), rgba(230,57,70,0.04))',
    border: '1px solid rgba(230,57,70,0.35)',
    boxShadow: '0 0 0 1px rgba(230,57,70,0.08) inset, 0 8px 24px rgba(230,57,70,0.12)',
    cursor: 'pointer',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  pulseDot: {
    display: 'inline-block',
    width: 10, height: 10,
    borderRadius: '50%',
    background: '#E63946',
    boxShadow: '0 0 0 3px rgba(230,57,70,0.25)',
    flexShrink: 0,
    animation: 'pulse 2s ease-in-out infinite',
  },
  bannerEtiqueta: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: '#FF6B7A',
  },
  bannerNombre: {
    margin: '3px 0 0',
    fontFamily: "'Oswald', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#fff',
  },
  bannerHora: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    color: 'rgba(255,255,255,0.40)',
  },
  bannerCta: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#FF6B7A',
    padding: '7px 16px',
    borderRadius: '8px',
    background: 'rgba(230,57,70,0.10)',
    border: '1px solid rgba(230,57,70,0.35)',
    whiteSpace: 'nowrap',
  },
}
