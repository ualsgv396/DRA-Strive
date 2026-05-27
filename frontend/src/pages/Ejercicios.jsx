import { useState, useEffect, useMemo, useRef } from 'react'
import { useResponsive } from '../hooks/useMediaQuery'
import api from '../api/axios'
import ListaEjercicios from '../components/ejercicio/ListaEjercicios'
import ModalDetallesEjercicio from '../components/ejercicio/ModalDetallesEjercicio'
import { useFavoritos } from '../hooks/useFavoritos'

const TIPOS = ['CARDIO', 'FUERZA', 'MOVILIDAD']
const DIFICULTADES = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO']

/**
 * Imagen con lazy loading y fade-in progresivo.
 * Se puede usar como reemplazo de <img> en TarjetaEjercicio si se desea.
 */
export function LazyImg({ src, alt, style, fallback }) {
  const [cargada, setCargada] = useState(false)
  const [error,   setError  ] = useState(false)

  if (error || !src) return fallback ?? null

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setCargada(true)}
      onError={() => setError(true)}
      style={{ ...style, opacity: cargada ? 1 : 0, transition: 'opacity 0.3s ease', objectFit: 'cover' }}
    />
  )
}

export default function Ejercicios() {
  const { isMobile } = useResponsive()

  const [ejercicios,        setEjercicios       ] = useState([])
  const [cargando,          setCargando         ] = useState(true)
  const [sincronizando,     setSincronizando    ] = useState(false)
  const [busqueda,          setBusqueda         ] = useState('')
  const [tipoSeleccionado,        setTipoSeleccionado       ] = useState(null)
  const [dificultadSeleccionada,  setDificultadSeleccionada ] = useState(null)
  const [grupoSeleccionado,       setGrupoSeleccionado      ] = useState(null)
  const [ejercicioDetalle,  setEjercicioDetalle ] = useState(null)
  const [error,             setError            ] = useState(null)
  const [exito,             setExito            ] = useState(null)
  // Estado exclusivo del bottom sheet de filtros
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const { favoritos, toggleFavorito } = useFavoritos()
  const [soloFavoritos, setSoloFavoritos] = useState(false)

  const drawerRef = useRef(null)

  useEffect(() => { cargarEjercicios() }, [])

  // Cierra el drawer al rotar a landscape/desktop
  useEffect(() => { if (!isMobile) setDrawerAbierto(false) }, [isMobile])

  const cargarEjercicios = async () => {
    try {
      setCargando(true)
      const r = await api.get('/exercises')
      setEjercicios(r.data ?? [])
      setError(null)
    } catch {
      setError('No se pudieron cargar los ejercicios')
    } finally {
      setCargando(false)
    }
  }

  const handleSincronizar = async () => {
    try {
      setSincronizando(true)
      await api.post('/exercises/sync/external', {}, { params: { limit: 100 } })
      await cargarEjercicios()
      mostrarExito('Ejercicios sincronizados correctamente')
    } catch {
      setError('Error al sincronizar ejercicios')
    } finally {
      setSincronizando(false)
    }
  }

  const handleBuscar = (e) => setBusqueda(e.target.value)

  const mostrarExito = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(null), 3500)
  }

  const gruposMusculares = useMemo(() => {
    const set = new Set()
    ejercicios.forEach(e => (e.muscleGroups ?? []).forEach(g => set.add(g)))
    return [...set].sort()
  }, [ejercicios])

  // Mismo patrón que el admin: filtrado en el padre con useMemo
  const ejerciciosFiltrados = useMemo(() => {
    let result = ejercicios
    if (busqueda) {
      const q = busqueda.toLowerCase()
      result = result.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.muscleGroups?.some(g => g.toLowerCase().includes(q))
      )
    }
    if (tipoSeleccionado)       result = result.filter(e => e.type === tipoSeleccionado)
    if (dificultadSeleccionada) result = result.filter(e => e.difficulty === dificultadSeleccionada)
    if (grupoSeleccionado)      result = result.filter(e => (e.muscleGroups ?? []).includes(grupoSeleccionado))
    if (soloFavoritos)          result = result.filter(e => favoritos.has(String(e.id)))
    return result
  }, [ejercicios, busqueda, tipoSeleccionado, dificultadSeleccionada, grupoSeleccionado, soloFavoritos, favoritos])

  const filtrosActivos =
    (tipoSeleccionado        !== null ? 1 : 0) +
    (dificultadSeleccionada  !== null ? 1 : 0) +
    (grupoSeleccionado       !== null ? 1 : 0) +
    (soloFavoritos           ? 1 : 0)

  // ── Chips de tipo (se renderizan en header desktop O en drawer móvil) ──
  const ChipsTipo = () => (
    <>
      <button
        style={{ ...s.chip, ...(tipoSeleccionado === null ? s.chipActivo : {}) }}
        onClick={() => setTipoSeleccionado(null)}
      >
        Todos
      </button>
      {TIPOS.map(tipo => (
        <button
          key={tipo}
          style={{ ...s.chip, ...(tipoSeleccionado === tipo ? s.chipActivo : {}) }}
          onClick={() => setTipoSeleccionado(tipoSeleccionado === tipo ? null : tipo)}
        >
          {tipo}
        </button>
      ))}
    </>
  )

  const ChipsGrupo = () => (
    <>
      <button
        style={{ ...s.chipGrupo, ...(grupoSeleccionado === null ? s.chipGrupoActivo : {}) }}
        onClick={() => setGrupoSeleccionado(null)}
      >
        Todos
      </button>
      {gruposMusculares.map(g => (
        <button
          key={g}
          style={{ ...s.chipGrupo, ...(grupoSeleccionado === g ? s.chipGrupoActivo : {}) }}
          onClick={() => setGrupoSeleccionado(grupoSeleccionado === g ? null : g)}
        >
          {g}
        </button>
      ))}
    </>
  )

  const ChipsDificultad = () => (
    <>
      <button
        style={{ ...s.chipGrupo, ...(dificultadSeleccionada === null ? s.chipGrupoActivo : {}) }}
        onClick={() => setDificultadSeleccionada(null)}
      >
        Todas
      </button>
      {DIFICULTADES.map(d => (
        <button
          key={d}
          style={{ ...s.chipGrupo, ...(dificultadSeleccionada === d ? s.chipGrupoActivo : {}) }}
          onClick={() => setDificultadSeleccionada(dificultadSeleccionada === d ? null : d)}
        >
          {d}
        </button>
      ))}
    </>
  )

  return (
    <div style={s.contenedor}>

      <main style={{ ...s.main, paddingBottom: `calc(100px + env(safe-area-inset-bottom, 0px))` }}>

        {/* Cabecera */}
        <div style={{ ...s.cabecera, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
          <div>
            <h1 style={s.titulo}>Catálogo de ejercicios</h1>
            <p style={s.subtitulo}>{ejercicios.length} ejercicios disponibles</p>
          </div>
          <button
            style={{ ...s.botonSync, opacity: sincronizando ? 0.6 : 1, width: isMobile ? '100%' : 'auto' }}
            onClick={handleSincronizar}
            disabled={sincronizando}
          >
            {sincronizando ? '⟳ Sincronizando...' : '⟳ Sincronizar'}
          </button>
        </div>

        {error  && <div style={s.alertaError}>{error}</div>}
        {exito  && <div style={s.alertaExito}>{exito}</div>}

        {/* Barra de búsqueda + botón filtros (móvil) */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            type="search"
            placeholder="Buscar ejercicio..."
            value={busqueda}
            onChange={handleBuscar}
            style={{ ...s.buscador, flex: 1 }}
          />
          {isMobile && (
            <button
              style={{ ...s.btnFiltros, ...(filtrosActivos > 0 ? s.btnFiltrosActivo : {}) }}
              onClick={() => setDrawerAbierto(true)}
              aria-label={`Filtros${filtrosActivos > 0 ? `, ${filtrosActivos} activos` : ''}`}
            >
              ⊞&thinsp;Filtros
              {filtrosActivos > 0 && (
                <span style={s.badgeFiltros}>{filtrosActivos}</span>
              )}
            </button>
          )}
        </div>

        {/* Filtros horizontales — solo en escritorio */}
        {!isMobile && (
          <>
            <div style={s.filtrosRow}>
              <ChipsTipo />
              <button
                style={{ ...s.chip, ...(soloFavoritos ? s.chipActivo : {}), display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => setSoloFavoritos(v => !v)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24"
                     fill={soloFavoritos ? 'currentColor' : 'none'}
                     stroke="currentColor" strokeWidth="2.2"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Favoritos{favoritos.size > 0 ? ` (${favoritos.size})` : ''}
              </button>
            </div>
            <div style={s.filtrosRow}>
              <span style={s.filtroLabel}>Dificultad:</span>
              <ChipsDificultad />
            </div>
            {gruposMusculares.length > 0 && (
              <div style={s.filtrosRow}>
                <span style={s.filtroLabel}>Músculo:</span>
                <ChipsGrupo />
              </div>
            )}
          </>
        )}

        {/* Chips activos compactos en móvil (debajo del buscador) */}
        {isMobile && filtrosActivos > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {tipoSeleccionado && (
              <button style={s.chipActivo2} onClick={() => setTipoSeleccionado(null)}>
                {tipoSeleccionado} ✕
              </button>
            )}
            {dificultadSeleccionada && (
              <button style={s.chipActivo2} onClick={() => setDificultadSeleccionada(null)}>
                {dificultadSeleccionada} ✕
              </button>
            )}
            {grupoSeleccionado && (
              <button style={s.chipActivo2} onClick={() => setGrupoSeleccionado(null)}>
                {grupoSeleccionado} ✕
              </button>
            )}
            {soloFavoritos && (
              <button style={s.chipActivo2} onClick={() => setSoloFavoritos(false)}>
                ❤ Favoritos ✕
              </button>
            )}
          </div>
        )}

        <ListaEjercicios
          ejercicios={ejerciciosFiltrados}
          cargando={cargando}
          onVerDetalles={setEjercicioDetalle}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      </main>

      {/* ── Bottom Sheet de filtros (móvil) ── */}
      {drawerAbierto && (
        <div
          className="sheet-overlay"
          onClick={() => setDrawerAbierto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de ejercicios"
        >
          <div
            ref={drawerRef}
            className="sheet-panel"
            style={s.drawerPanel}
            onClick={e => e.stopPropagation()}
          >
            <div className="sheet-handle" style={s.drawerHandle} />

            <div style={s.drawerCabecera}>
              <h2 style={s.drawerTitulo}>Filtros</h2>
              {filtrosActivos > 0 && (
                <button
                  style={s.btnLimpiar}
                  onClick={() => { setTipoSeleccionado(null); setDificultadSeleccionada(null); setGrupoSeleccionado(null); setSoloFavoritos(false) }}
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <p style={s.drawerSeccion}>Favoritos</p>
            <button
              style={{ ...s.chipGrupo, ...(soloFavoritos ? s.chipGrupoActivo : {}), display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setSoloFavoritos(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24"
                   fill={soloFavoritos ? 'currentColor' : 'none'}
                   stroke="currentColor" strokeWidth="2.2"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Solo favoritos{favoritos.size > 0 ? ` (${favoritos.size})` : ''}
            </button>

            <p style={s.drawerSeccion}>Tipo de ejercicio</p>
            <div className="scroll-x" style={{ paddingBottom: '8px' }}>
              <ChipsTipo />
            </div>

            <p style={s.drawerSeccion}>Dificultad</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <ChipsDificultad />
            </div>

            {gruposMusculares.length > 0 && (
              <>
                <p style={s.drawerSeccion}>Grupo muscular</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <ChipsGrupo />
                </div>
              </>
            )}

            <button
              style={s.btnAplicar}
              onClick={() => setDrawerAbierto(false)}
            >
              {filtrosActivos > 0 ? `Aplicar ${filtrosActivos} filtro${filtrosActivos > 1 ? 's' : ''}` : 'Cerrar'}
            </button>
          </div>
        </div>
      )}

      {ejercicioDetalle && (
        <ModalDetallesEjercicio
          ejercicio={ejercicioDetalle}
          onCerrar={() => setEjercicioDetalle(null)}
        />
      )}
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  contenedor: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f7f7f7',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    padding: '24px 16px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  cabecera: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '12px',
  },
  titulo: { margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#111', fontFamily: "'Oswald', sans-serif" },
  subtitulo: { margin: 0, fontSize: '13px', color: '#999' },
  botonSync: {
    padding: '10px 20px',
    backgroundColor: '#E63946',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    minHeight: '44px',
    whiteSpace: 'nowrap',
  },
  alertaError: {
    backgroundColor: '#fde8ea', color: '#c0392b', padding: '12px 16px',
    borderRadius: '8px', marginBottom: '14px', fontSize: '14px',
  },
  alertaExito: {
    backgroundColor: '#d4edda', color: '#155724', padding: '12px 16px',
    borderRadius: '8px', marginBottom: '14px', fontSize: '14px', fontWeight: '600',
  },
  buscador: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: '46px',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  // Botón "Filtros" en móvil
  btnFiltros: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    minHeight: '46px',
    minWidth: '44px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  btnFiltrosActivo: {
    borderColor: '#E63946',
    color: '#E63946',
    backgroundColor: 'rgba(230,57,70,0.05)',
  },
  badgeFiltros: {
    backgroundColor: '#E63946',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
    lineHeight: '16px',
  },
  filtrosRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '10px',
  },
  filtroLabel: { fontSize: '12px', fontWeight: '600', color: '#888' },
  chip: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    color: '#555',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    minHeight: '36px',
  },
  chipActivo: {
    backgroundColor: '#E63946',
    color: '#fff',
    borderColor: '#E63946',
    fontWeight: '700',
  },
  chipGrupo: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    minHeight: '34px',
  },
  chipGrupoActivo: {
    backgroundColor: '#222',
    color: '#fff',
    borderColor: '#222',
    fontWeight: '700',
  },
  // Chips activos compactos que aparecen debajo del buscador en móvil
  chipActivo2: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(230,57,70,0.1)',
    border: '1px solid rgba(230,57,70,0.4)',
    color: '#E63946',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  // ── Drawer ──
  drawerPanel: {
    backgroundColor: '#fff',
  },
  drawerHandle: {
    backgroundColor: '#bbb',
  },
  drawerCabecera: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  drawerTitulo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111',
    margin: 0,
    fontFamily: "'Oswald', sans-serif",
  },
  btnLimpiar: {
    background: 'none',
    border: 'none',
    color: '#E63946',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 0',
    minHeight: '36px',
  },
  drawerSeccion: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
    marginTop: '20px',
    margin: '20px 0 10px',
  },
  btnAplicar: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#E63946',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    marginTop: '28px',
    cursor: 'pointer',
    minHeight: '50px',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '0.5px',
  },
}
