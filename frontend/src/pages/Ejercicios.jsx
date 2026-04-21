import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/ContextoAuth'
import api from '../api/axios'

const GRUPOS_MUSCULARES = ['Todos', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Abdomen', 'Glúteos', 'Cardio']
const DIFICULTADES = ['Todas', 'Principiante', 'Intermedio', 'Avanzado']

export default function Ejercicios() {
  const navigate = useNavigate()
  const { cerrarSesion, usuario } = useAuth()
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Todos')
  const [dificultadSeleccionada, setDificultadSeleccionada] = useState('Todas')
  const [ejercicioDetalle, setEjercicioDetalle] = useState(null)

  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        const respuesta = await api.get('/ejercicios')
        setEjercicios(respuesta.data)
      } catch (err) {
        console.error('Error cargando ejercicios:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarEjercicios()
  }, [])

  const ejerciciosFiltrados = ejercicios.filter((e) => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideGrupo = grupoSeleccionado === 'Todos' || e.grupoMuscular === grupoSeleccionado
    const coincideDificultad = dificultadSeleccionada === 'Todas' || e.dificultad === dificultadSeleccionada
    return coincideBusqueda && coincideGrupo && coincideDificultad
  })

  return (
    <div style={estilos.contenedor}>

      {/* NAVBAR */}
      <nav style={estilos.navbar}>
        <span style={estilos.logo}>STRIVE</span>
        <div style={estilos.navLinks}>
          <button style={estilos.navLink} onClick={() => navigate('/panel')}>
            Mis rutinas
          </button>
          <button style={{ ...estilos.navLink, color: '#E63946' }}>
            Ejercicios
          </button>
        </div>
        <div style={estilos.navDerecha}>
          <span style={estilos.nombreUsuario}>Hola, {usuario?.nombre}</span>
          <button style={estilos.botonSalir} onClick={() => { cerrarSesion(); navigate('/') }}>
            Salir
          </button>
        </div>
      </nav>

      <main style={estilos.main}>

        {/* Cabecera */}
        <div style={estilos.cabecera}>
          <div>
            <h1 style={estilos.titulo}>Catálogo de ejercicios</h1>
            <p style={estilos.subtitulo}>
              {ejerciciosFiltrados.length} ejercicios disponibles
            </p>
          </div>
          <button style={estilos.botonNueva} onClick={() => navigate('/rutina/nueva')}>
            + Nueva rutina
          </button>
        </div>

        {/* Filtros */}
        <div style={estilos.filtrosContenedor}>
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={estilos.buscador}
          />
          <div style={estilos.filtrosScroll}>
            {GRUPOS_MUSCULARES.map((grupo) => (
              <button
                key={grupo}
                onClick={() => setGrupoSeleccionado(grupo)}
                style={{
                  ...estilos.filtroBtn,
                  ...(grupoSeleccionado === grupo ? estilos.filtroBtnActivo : {})
                }}
              >
                {grupo}
              </button>
            ))}
          </div>
          <div style={estilos.filtrosScroll}>
            {DIFICULTADES.map((dif) => (
              <button
                key={dif}
                onClick={() => setDificultadSeleccionada(dif)}
                style={{
                  ...estilos.filtroBtn,
                  ...(dificultadSeleccionada === dif ? estilos.filtroBtnActivo : {})
                }}
              >
                {dif}
              </button>
            ))}
          </div>
        </div>

        {/* Cargando */}
        {cargando && (
          <div style={estilos.centro}>
            <p style={estilos.textoCentro}>Cargando ejercicios...</p>
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && ejerciciosFiltrados.length === 0 && (
          <div style={estilos.centro}>
            <span style={{ fontSize: '48px' }}>🔍</span>
            <p style={estilos.textoCentro}>No se encontraron ejercicios</p>
          </div>
        )}

        {/* Grid ejercicios */}
        {!cargando && ejerciciosFiltrados.length > 0 && (
          <div style={estilos.grid}>
            {ejerciciosFiltrados.map((ejercicio) => (
              <div
                key={ejercicio.id}
                style={estilos.tarjeta}
                onClick={() => setEjercicioDetalle(ejercicio)}
              >
                <div style={estilos.tarjetaImagen}>
                  {ejercicio.imagenUrl
                    ? <img src={ejercicio.imagenUrl} alt={ejercicio.nombre} style={estilos.imagen} />
                    : <span style={estilos.imagenPlaceholder}>💪</span>
                  }
                </div>
                <div style={estilos.tarjetaContenido}>
                  <div style={estilos.tarjetaHeader}>
                    <span style={{
                      ...estilos.badge,
                      backgroundColor: coloresDificultad[ejercicio.dificultad]?.bg || 'rgba(255,255,255,0.1)',
                      color: coloresDificultad[ejercicio.dificultad]?.text || '#FFFFFF'
                    }}>
                      {ejercicio.dificultad}
                    </span>
                    <span style={estilos.grupoTexto}>{ejercicio.grupoMuscular}</span>
                  </div>
                  <h3 style={estilos.tarjetaTitulo}>{ejercicio.nombre}</h3>
                  <p style={estilos.tarjetaDescripcion}>
                    {ejercicio.descripcion?.substring(0, 80)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALLE */}
      {ejercicioDetalle && (
        <div style={estilos.modalOverlay} onClick={() => setEjercicioDetalle(null)}>
          <div style={estilos.modal} onClick={(e) => e.stopPropagation()}>
            <button style={estilos.modalCerrar} onClick={() => setEjercicioDetalle(null)}>✕</button>
            <div style={estilos.modalImagen}>
              {ejercicioDetalle.imagenUrl
                ? <img src={ejercicioDetalle.imagenUrl} alt={ejercicioDetalle.nombre} style={estilos.modalImg} />
                : <span style={{ fontSize: '80px' }}>💪</span>
              }
            </div>
            <div style={estilos.modalContenido}>
              <div style={estilos.modalBadges}>
                <span style={{
                  ...estilos.badge,
                  backgroundColor: coloresDificultad[ejercicioDetalle.dificultad]?.bg,
                  color: coloresDificultad[ejercicioDetalle.dificultad]?.text
                }}>
                  {ejercicioDetalle.dificultad}
                </span>
                <span style={estilos.badge}>{ejercicioDetalle.grupoMuscular}</span>
              </div>
              <h2 style={estilos.modalTitulo}>{ejercicioDetalle.nombre}</h2>
              <p style={estilos.modalDescripcion}>{ejercicioDetalle.descripcion}</p>
              <button
                style={estilos.botonNueva}
                onClick={() => { navigate('/rutina/nueva'); setEjercicioDetalle(null) }}
              >
                Añadir a rutina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const coloresDificultad = {
  'Principiante': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  'Intermedio': { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
  'Avanzado': { bg: 'rgba(230, 57, 70, 0.15)', text: '#E63946' }
}

const estilos = {
  contenedor: { minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#FFFFFF' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#111111'
  },
  logo: {
    fontFamily: "'Oswald', sans-serif", fontSize: '24px', fontWeight: '700',
    fontStyle: 'italic', color: '#E63946', letterSpacing: '2px'
  },
  navLinks: { display: 'flex', gap: '8px' },
  navLink: {
    backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
    fontSize: '15px', fontFamily: "'Inter', sans-serif", padding: '8px 16px',
    borderRadius: '8px', cursor: 'pointer'
  },
  navDerecha: { display: 'flex', alignItems: 'center', gap: '16px' },
  nombreUsuario: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" },
  botonSalir: {
    backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'Inter', sans-serif", cursor: 'pointer'
  },
  main: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  cabecera: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  titulo: { fontFamily: "'Oswald', sans-serif", fontSize: '42px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' },
  subtitulo: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" },
  botonNueva: {
    backgroundColor: '#E63946', color: '#FFFFFF', border: 'none',
    padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
    fontFamily: "'Oswald', sans-serif", letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
  },
  filtrosContenedor: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  buscador: {
    backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '14px 16px', fontSize: '15px', color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif", outline: 'none', width: '100%'
  },
  filtrosScroll: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filtroBtn: {
    backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: '20px',
    fontSize: '13px', fontFamily: "'Inter', sans-serif", cursor: 'pointer'
  },
  filtroBtnActivo: {
    backgroundColor: '#E63946', border: '1px solid #E63946',
    color: '#FFFFFF', fontWeight: '600'
  },
  centro: { textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  textoCentro: { color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  tarjeta: {
    backgroundColor: '#1A1A1A', borderRadius: '12px', overflow: 'hidden',
    cursor: 'pointer', borderLeft: '4px solid #E63946'
  },
  tarjetaImagen: {
    height: '180px', backgroundColor: '#222', display: 'flex',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  imagen: { width: '100%', height: '100%', objectFit: 'cover' },
  imagenPlaceholder: { fontSize: '48px' },
  tarjetaContenido: { padding: '20px' },
  tarjetaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', fontFamily: "'Inter', sans-serif" },
  grupoTexto: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" },
  tarjetaTitulo: { fontFamily: "'Oswald', sans-serif", fontSize: '18px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' },
  tarjetaDescripcion: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", lineHeight: '1.5' },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: '#1A1A1A', borderRadius: '16px', maxWidth: '560px',
    width: '100%', overflow: 'hidden', position: 'relative'
  },
  modalCerrar: {
    position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.5)',
    border: 'none', color: '#FFFFFF', width: '32px', height: '32px',
    borderRadius: '50%', cursor: 'pointer', fontSize: '14px'
  },
  modalImagen: {
    height: '240px', backgroundColor: '#222', display: 'flex',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  modalImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalContenido: { padding: '28px' },
  modalBadges: { display: 'flex', gap: '8px', marginBottom: '16px' },
  modalTitulo: { fontFamily: "'Oswald', sans-serif", fontSize: '28px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' },
  modalDescripcion: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", lineHeight: '1.7', marginBottom: '24px' }
}