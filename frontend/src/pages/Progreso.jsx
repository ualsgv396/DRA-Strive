import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import GraficaLinea from '../components/progreso/GraficaLinea'

const RED  = '#E63946'
const GOLD = '#F59E0B'

// ── Selector de ejercicio ─────────────────────────────────────────────────────

function SelectorEjercicio({ ejercicios, seleccionado, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto]   = useState(false)

  const filtrados = ejercicios.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAbierto(v => !v)}
        style={s.selectorBtn}
      >
        <span style={{ flex: 1, textAlign: 'left', color: seleccionado ? '#fff' : 'rgba(255,255,255,0.4)' }}>
          {seleccionado?.nombre ?? 'Selecciona un ejercicio…'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div style={s.dropdown}>
          <input
            autoFocus
            type="text"
            placeholder="Buscar…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={s.dropdownInput}
          />
          <div style={s.dropdownList}>
            {filtrados.length === 0 && (
              <p style={s.dropdownVacio}>Sin resultados</p>
            )}
            {filtrados.map(ej => (
              <button
                key={ej.id}
                onClick={() => { onSeleccionar(ej); setAbierto(false); setBusqueda('') }}
                style={{
                  ...s.dropdownItem,
                  background: seleccionado?.id === ej.id ? 'rgba(230,57,70,0.12)' : 'transparent',
                  color:      seleccionado?.id === ej.id ? RED : 'rgba(255,255,255,0.8)',
                }}
              >
                {ej.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de Récord Personal ────────────────────────────────────────────────

function TarjetaPR({ resumen }) {
  if (!resumen?.recordPersonal) return null
  const fecha = new Date(resumen.fechaRecord + 'T00:00:00')
    .toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={s.prCard}>
      <span style={s.prEstrella}>★</span>
      <div>
        <p style={s.prLabel}>Récord Personal</p>
        <p style={s.prValor}>
          {Number(resumen.recordPersonal)} {resumen.unidadCarga}
        </p>
        <p style={s.prFecha}>{fecha}</p>
      </div>
      <div style={s.prStat}>
        <span style={s.prStatNum}>{resumen.totalSesiones}</span>
        <span style={s.prStatLabel}>sesiones</span>
      </div>
    </div>
  )
}

// ── Historial de puntos ───────────────────────────────────────────────────────

function TablaHistorial({ puntos = [], unidad }) {
  const ordenados = [...puntos].reverse()
  return (
    <div style={s.tabla}>
      <div style={s.tablaHead}>
        <span>Fecha</span>
        <span>Carga</span>
        <span>Series × Reps</span>
      </div>
      {ordenados.map((p, i) => (
        <div key={i} style={{ ...s.tablaFila, background: p.esPR ? 'rgba(245,158,11,0.07)' : 'transparent' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
          <span style={{ fontWeight: 600, color: p.esPR ? GOLD : '#fff', fontSize: 14 }}>
            {p.cargaMaxima != null ? `${Number(p.cargaMaxima)} ${unidad}` : `${p.repeticiones} reps`}
            {p.esPR && <span style={{ marginLeft: 6, fontSize: 11, color: GOLD }}>★ PR</span>}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            {p.series}×{p.repeticiones}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Progreso() {
  const [ejercicios,   setEjercicios]   = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [resumen,      setResumen]      = useState(null)
  const [cargandoList, setCargandoList] = useState(true)
  const [cargandoGraf, setCargandoGraf] = useState(false)
  const [error,        setError]        = useState('')

  // Cargar lista de ejercicios entrenados
  useEffect(() => {
    api.get('/progreso/ejercicios')
      .then(r => setEjercicios(r.data ?? []))
      .catch(() => setError('No se pudo cargar la lista de ejercicios'))
      .finally(() => setCargandoList(false))
  }, [])

  // Cargar progreso del ejercicio seleccionado
  const cargarProgreso = useCallback(async (ej) => {
    setResumen(null)
    setError('')
    setCargandoGraf(true)
    try {
      const { data } = await api.get(`/progreso/ejercicio/${ej.id}`)
      setResumen(data)
    } catch {
      setError('No hay datos suficientes para este ejercicio')
    } finally {
      setCargandoGraf(false)
    }
  }, [])

  const handleSeleccionar = (ej) => {
    setSeleccionado(ej)
    cargarProgreso(ej)
  }

  return (
    <div style={s.pagina}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <main style={s.main}>

        {/* Header */}
        <header style={s.hero}>
          <div style={s.heroIco}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
              stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <span style={s.kicker}>ESTADÍSTICAS</span>
            <h1 style={s.titulo}>Progreso</h1>
          </div>
        </header>
        <p style={s.subtitulo}>
          Selecciona un ejercicio para ver cómo ha evolucionado tu carga a lo largo del tiempo.
        </p>

        {/* Estado vacío */}
        {!cargandoList && ejercicios.length === 0 && (
          <div style={s.vacio}>
            <span style={{ fontSize: 48, opacity: 0.6 }}>📊</span>
            <p style={s.vacioTitulo}>Sin datos todavía</p>
            <p style={s.vacioSub}>Completa tu primer entrenamiento para empezar a ver tu progreso.</p>
          </div>
        )}

        {/* Selector */}
        {ejercicios.length > 0 && (
          <div style={s.bloque}>
            <label style={s.label}>Ejercicio</label>
            <SelectorEjercicio
              ejercicios={ejercicios}
              seleccionado={seleccionado}
              onSeleccionar={handleSeleccionar}
            />
          </div>
        )}

        {/* Spinner cargando gráfica */}
        {cargandoGraf && (
          <div style={s.centrado}>
            <div style={s.spinner} />
          </div>
        )}

        {/* Error */}
        {error && !cargandoGraf && (
          <p style={s.errorMsg}>{error}</p>
        )}

        {/* Contenido principal */}
        {resumen && !cargandoGraf && (
          <>
            <TarjetaPR resumen={resumen} />

            <div style={s.bloque}>
              <div style={s.bloqueHeader}>
                <h2 style={s.tituloBloque}>{resumen.nombre}</h2>
                <span style={s.pildora}>{resumen.unidadCarga}</span>
              </div>

              {resumen.puntos.length === 1 ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                  Solo hay 1 sesión registrada. Completa más entrenamientos para ver la evolución.
                </p>
              ) : (
                <GraficaLinea puntos={resumen.puntos} unidad={resumen.unidadCarga} />
              )}
            </div>

            {resumen.puntos.length > 0 && (
              <div style={s.bloque}>
                <h2 style={s.tituloBloque}>Historial</h2>
                <TablaHistorial puntos={resumen.puntos} unidad={resumen.unidadCarga} />
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = {
  pagina: { minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#fff', paddingBottom: 104 },
  main:   { maxWidth: 760, margin: '0 auto', padding: '36px clamp(16px,4vw,28px) 0' },

  hero:    { display: 'flex', alignItems: 'center', gap: 14 },
  heroIco: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0, color: RED,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(230,57,70,0.12)', boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.32)',
  },
  kicker:  { display: 'block', color: RED, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, fontFamily: "'Inter',sans-serif" },
  titulo:  { fontFamily: "'Oswald',sans-serif", fontSize: 'clamp(36px,7vw,48px)', fontWeight: 700, textTransform: 'uppercase', margin: 0, lineHeight: 1 },
  subtitulo: { color: 'rgba(255,255,255,0.42)', fontSize: 14, margin: '12px 0 24px', lineHeight: 1.5, fontFamily: "'Inter',sans-serif", maxWidth: 500 },

  bloque:  { background: '#131313', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 20px', marginBottom: 16 },
  bloqueHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  tituloBloque: { fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 700, textTransform: 'uppercase', margin: 0 },
  pildora: {
    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: '1.2px', textTransform: 'uppercase',
    background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)',
    color: RED, borderRadius: 999, padding: '3px 9px',
  },
  label: { display: 'block', marginBottom: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600, fontFamily: "'Inter',sans-serif" },

  // Selector
  selectorBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12,
    padding: '12px 14px', color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 14,
    cursor: 'pointer', textAlign: 'left',
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, marginTop: 4,
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12,
    overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
  },
  dropdownInput: {
    width: '100%', background: '#222', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 14px', color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  },
  dropdownList: { maxHeight: 220, overflowY: 'auto' },
  dropdownItem: {
    display: 'block', width: '100%', padding: '10px 14px', border: 'none',
    fontFamily: "'Inter',sans-serif", fontSize: 14, textAlign: 'left', cursor: 'pointer',
    transition: 'background .1s',
  },
  dropdownVacio: { padding: '12px 14px', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: "'Inter',sans-serif", margin: 0 },

  // PR card
  prCard: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))',
    border: '1px solid rgba(245,158,11,0.35)', borderRadius: 18, padding: '16px 20px',
  },
  prEstrella: { fontSize: 28, flexShrink: 0, color: GOLD },
  prLabel:    { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'rgba(245,158,11,0.7)', margin: 0 },
  prValor:    { fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 28, color: GOLD, margin: '2px 0' },
  prFecha:    { fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 },
  prStat:     { marginLeft: 'auto', textAlign: 'center', flexShrink: 0 },
  prStatNum:  { display: 'block', fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 26, color: '#fff' },
  prStatLabel:{ display: 'block', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)' },

  // Tabla historial
  tabla:     { display: 'flex', flexDirection: 'column', gap: 2 },
  tablaHead: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    padding: '6px 10px',
    fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '1.2px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
  },
  tablaFila: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    padding: '9px 10px', borderRadius: 8,
    fontFamily: "'Inter',sans-serif",
  },

  // Estados
  vacio:      { textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  vacioTitulo:{ fontFamily: "'Oswald',sans-serif", fontSize: 24, textTransform: 'uppercase', margin: 0 },
  vacioSub:   { fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0, maxWidth: 320, lineHeight: 1.5 },
  centrado:   { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  spinner:    { width: 28, height: 28, border: '3px solid rgba(230,57,70,0.2)', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  errorMsg:   { fontFamily: "'Inter',sans-serif", fontSize: 13, color: RED, textAlign: 'center', padding: '20px 0' },
}
