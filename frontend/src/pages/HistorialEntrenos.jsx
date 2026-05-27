import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const ESTADO = {
  COMPLETED: { label: 'Completada', color: 'text-green-400' },
  ABANDONED: { label: 'Abandonada', color: 'text-white/40' },
  STARTED:   { label: 'En curso',   color: 'text-[#E63946]' },
}

const POR_PAGINA = 10

function GraficoProgresion({ puntos }) {
  if (puntos.length === 0) {
    return (
      <p className="text-white/30 text-xs text-center py-8">
        Sin registros de carga para este ejercicio
      </p>
    )
  }

  const W = 360
  const H = 110
  const PAD = { top: 14, right: 14, bottom: 28, left: 44 }
  const IW = W - PAD.left - PAD.right
  const IH = H - PAD.top - PAD.bottom

  const loads = puntos.map(p => p.load)
  const minL  = Math.min(...loads)
  const maxL  = Math.max(...loads)
  const rangL = maxL - minL || 1

  const cx = i  => PAD.left + (puntos.length === 1 ? IW / 2 : (i / (puntos.length - 1)) * IW)
  const cy = ld => PAD.top + IH - ((ld - minL) / rangL) * IH

  const linePoints = puntos.map((p, i) => `${cx(i)},${cy(p.load)}`).join(' ')
  const areaPoints =
    `${cx(0)},${PAD.top + IH} ` +
    puntos.map((p, i) => `${cx(i)},${cy(p.load)}`).join(' ') +
    ` ${cx(puntos.length - 1)},${PAD.top + IH}`

  const fmtDate = d =>
    new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#E63946" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#E63946" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {puntos.length > 1 && <polygon points={areaPoints} fill="url(#chartGrad)" />}
      {puntos.length > 1 && (
        <polyline
          points={linePoints}
          fill="none"
          stroke="#E63946"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Y labels */}
      <text x={PAD.left - 6} y={PAD.top + 4}       textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="monospace">{maxL}</text>
      {minL !== maxL && (
        <text x={PAD.left - 6} y={PAD.top + IH + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="monospace">{minL}</text>
      )}

      {/* X labels */}
      <text x={cx(0)}              y={H - 5} textAnchor="start"  fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace">{fmtDate(puntos[0].fecha)}</text>
      {puntos.length > 1 && (
        <text x={cx(puntos.length - 1)} y={H - 5} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace">{fmtDate(puntos[puntos.length - 1].fecha)}</text>
      )}

      {/* Points */}
      {puntos.map((p, i) => (
        <g key={`${p.fecha}-${i}`}>
          <title>{fmtDate(p.fecha)} · {p.load} {p.unit} · {p.sets}×{p.reps}</title>
          <circle cx={cx(i)} cy={cy(p.load)} r={5}   fill="#E63946" opacity="0.25" />
          <circle cx={cx(i)} cy={cy(p.load)} r={3}   fill="#E63946" />
          <circle cx={cx(i)} cy={cy(p.load)} r={1.5} fill="#fff"    />
        </g>
      ))}
    </svg>
  )
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuracion(sesion) {
  if (sesion.durationMinutes != null) return `${sesion.durationMinutes} min`
  if (sesion.startedAt && sesion.completedAt) {
    const mins = Math.round((new Date(sesion.completedAt) - new Date(sesion.startedAt)) / 60000)
    return mins > 0 ? `${mins} min` : '< 1 min'
  }
  return '—'
}

export default function HistorialEntrenos() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(0)
  const [expandida, setExpandida] = useState(null)
  const [detalles, setDetalles] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [chartEjercicio, setChartEjercicio] = useState(null)

  useEffect(() => {
    api.get('/training-sessions?limit=30')
      .then(r => setSesiones(r.data ?? []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { setPagina(0) }, [busqueda, filtroEstado])

  const sesionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return sesiones.filter(s => {
      const coincideNombre = !q || s.routineName?.toLowerCase().includes(q)
      const coincideEstado = filtroEstado === 'TODOS' || s.status === filtroEstado
      return coincideNombre && coincideEstado
    })
  }, [sesiones, busqueda, filtroEstado])

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta sesión?')) return
    try {
      await api.delete(`/training-sessions/${id}`)
      setSesiones(prev => prev.filter(s => s.id !== id))
      if (expandida === id) setExpandida(null)
    } catch {
      setError('Error al eliminar la sesión')
    }
  }

  const abrirChart = (titulo) => {
    const puntos = sesiones
      .filter(s => s.status === 'COMPLETED')
      .flatMap(s => {
        const matching = (s.exercises ?? []).filter(rec =>
          rec.routineExercise?.exercise?.title === titulo &&
          rec.loadCompleted !== null &&
          rec.loadCompleted !== undefined
        )
        return matching.map(rec => ({
          fecha: s.completedAt ?? s.startedAt,
          load: Number.parseFloat(rec.loadCompleted),
          unit: rec.loadUnit ?? 'KG',
          sets: rec.setsCompleted,
          reps: rec.repsCompleted,
        }))
      })
      .filter(p => !Number.isNaN(p.load) && p.load > 0)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    setChartEjercicio({ titulo, puntos })
  }

  const toggleDetalle = async (sesion) => {
    if (expandida === sesion.id) { setExpandida(null); return }
    setExpandida(sesion.id)
    if (detalles[sesion.id]) return
    if (sesion.exercises?.length > 0) {
      setDetalles(prev => ({ ...prev, [sesion.id]: sesion.exercises }))
      return
    }
    try {
      const { data } = await api.get(`/training-sessions/${sesion.id}`)
      setDetalles(prev => ({ ...prev, [sesion.id]: data.exercises ?? [] }))
    } catch {
      setDetalles(prev => ({ ...prev, [sesion.id]: [] }))
    }
  }

  const totalPaginas = Math.ceil(sesionesFiltradas.length / POR_PAGINA)
  const paginadas = sesionesFiltradas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-28">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111]">
        <span
          className="font-['Oswald'] text-2xl font-bold italic text-[#E63946] tracking-widest cursor-pointer"
          onClick={() => navigate('/panel')}
        >
          STRIVE
        </span>
        <button
          onClick={() => navigate('/panel')}
          className="text-white/50 border border-white/20 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors"
        >
          ← Panel
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-10">

        <h1 className="font-['Oswald'] text-4xl font-bold uppercase mb-2">Historial</h1>
        <p className="text-white/40 text-sm mb-6">Tus últimas 30 sesiones de entrenamiento</p>

        {!cargando && sesiones.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="search"
              placeholder="Buscar por rutina..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1 h-10 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-[#E63946] transition-colors"
            />
            <div className="flex gap-2">
              {[
                { value: 'TODOS',     label: 'Todas' },
                { value: 'COMPLETED', label: 'Completadas' },
                { value: 'ABANDONED', label: 'Abandonadas' },
                { value: 'STARTED',   label: 'En curso' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFiltroEstado(value)}
                  className="h-10 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                  style={
                    filtroEstado === value
                      ? { background: 'rgba(230,57,70,0.12)', color: '#FF6B7A', border: '1px solid rgba(230,57,70,0.35)' }
                      : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm mb-6">
            {error}
          </div>
        )}

        {cargando && (
          <p className="text-white/40 text-center py-20">Cargando historial...</p>
        )}

        {!cargando && sesiones.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-['Oswald'] text-2xl font-bold uppercase mb-2">Sin entrenamientos</p>
            <p className="text-white/40 text-sm mb-6">Inicia tu primer entrenamiento desde una rutina</p>
            <button
              onClick={() => navigate('/panel')}
              className="bg-[#E63946] text-white px-8 py-3 rounded-xl font-['Oswald'] font-bold uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
            >
              Ir al panel
            </button>
          </div>
        )}

        {!cargando && sesiones.length > 0 && sesionesFiltradas.length === 0 && (
          <p className="text-white/35 text-sm text-center py-16">
            No hay sesiones que coincidan con los filtros aplicados
          </p>
        )}

        {!cargando && sesionesFiltradas.length > 0 && (
          <>
            {/* Tabla */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden mb-6">
              {/* Cabecera */}
              <div className="grid grid-cols-[1fr_1.5fr_80px_110px_100px] gap-4 px-5 py-3 border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                <span>Fecha</span>
                <span>Rutina</span>
                <span className="text-center">Duración</span>
                <span className="text-center">Estado</span>
                <span />
              </div>

              {paginadas.map(sesion => {
                const estado = ESTADO[sesion.status] ?? { label: sesion.status, color: 'text-white/40' }
                const abierta = expandida === sesion.id
                const ejerciciosDetalle = detalles[sesion.id]
                return (
                  <div key={sesion.id} className="border-b border-white/5 last:border-b-0">
                    {/* Fila principal */}
                    <div className="grid grid-cols-[1fr_1.5fr_80px_110px_100px] gap-4 px-5 py-4 items-center">
                      <span className="text-white/60 text-sm">{formatFecha(sesion.startedAt)}</span>
                      <span className="font-['Oswald'] font-semibold uppercase truncate text-sm">
                        {sesion.routineName}
                      </span>
                      <span className="text-white/60 text-sm text-center">
                        {formatDuracion(sesion)}
                      </span>
                      <span className={`text-xs font-semibold text-center ${estado.color}`}>
                        {estado.label}
                      </span>
                      <div className="flex gap-2 justify-end items-center">
                        {sesion.status === 'STARTED' && (
                          <button
                            onClick={() => navigate(`/entrenamiento/${sesion.id}`)}
                            className="text-xs text-[#E63946] border border-[#E63946]/40 px-2 py-1 rounded hover:bg-[#E63946]/10 transition-colors"
                          >
                            Continuar
                          </button>
                        )}
                        <button
                          onClick={() => eliminar(sesion.id)}
                          className="text-xs text-white/30 border border-white/10 px-2 py-1 rounded hover:text-[#E63946] hover:border-[#E63946]/40 transition-colors"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => toggleDetalle(sesion)}
                          className={`text-white/25 text-xs hover:text-white/60 transition-all duration-200 ${abierta ? 'rotate-180' : ''}`}
                          aria-label={abierta ? 'Cerrar detalle' : 'Ver detalle'}
                        >
                          ▼
                        </button>
                      </div>
                    </div>

                    {/* Panel de detalle expandible */}
                    {abierta && (
                      <div className="px-5 pb-4 pt-1">
                        {sesion.notes && (
                          <p
                            className="text-xs italic mb-3 pb-3 border-b border-white/[0.06]"
                            style={{ color: 'rgba(255,255,255,0.45)' }}
                          >
                            "{sesion.notes}"
                          </p>
                        )}
                        {!ejerciciosDetalle && (
                          <p className="text-white/30 text-xs py-2">Cargando detalle...</p>
                        )}
                        {ejerciciosDetalle?.length === 0 && (
                          <p className="text-white/30 text-xs py-2">Sin registros de ejercicios</p>
                        )}
                        {ejerciciosDetalle?.length > 0 && (
                          <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                            {ejerciciosDetalle.map((rec, i) => {
                              const nombre = rec.routineExercise?.exercise?.title ?? `Ejercicio ${i + 1}`
                              const carga = rec.loadCompleted == null
                                ? null
                                : `${rec.loadCompleted} ${rec.loadUnit ?? ''}`
                              return (
                                <div
                                  key={rec.id ?? i}
                                  className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0"
                                  style={{ background: 'rgba(255,255,255,0.015)' }}
                                >
                                  <span className="font-['Oswald'] text-sm font-semibold uppercase truncate flex-1">
                                    {nombre}
                                  </span>
                                  <span className="font-mono text-xs text-white/50 shrink-0">
                                    {rec.setsCompleted} × {rec.repsCompleted}
                                    {carga && <span className="text-[#FF6B7A] ml-1.5">{carga}</span>}
                                  </span>
                                  {rec.notes && (
                                    <span className="text-white/30 text-xs italic truncate max-w-[160px] shrink-0">
                                      "{rec.notes}"
                                    </span>
                                  )}
                                  {rec.routineExercise?.exercise?.title && (
                                    <button
                                      onClick={() => abrirChart(rec.routineExercise.exercise.title)}
                                      className="shrink-0 text-white/20 hover:text-[#FF6B7A] transition-colors"
                                      aria-label="Ver progresión de carga"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="border border-white/20 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-white/40 text-sm">
                  {pagina + 1} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina === totalPaginas - 1}
                  className="border border-white/20 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Modal de progresión de carga */}
      {chartEjercicio && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Progresión de ${chartEjercicio.titulo}`}
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onKeyDown={e => { if (e.key === 'Escape') setChartEjercicio(null) }}
        >
          <div
            className="rounded-2xl w-full max-w-md"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-6 pt-6 pb-2">
              <h3 className="font-['Oswald'] text-lg font-bold uppercase tracking-wide truncate">
                {chartEjercicio.titulo}
              </h3>
              <p className="text-white/35 text-xs mt-0.5">Evolución de carga · últimas 30 sesiones</p>
            </div>

            <div className="px-4 py-3">
              <GraficoProgresion puntos={chartEjercicio.puntos} />
            </div>

            {chartEjercicio.puntos.length > 0 && (
              <div className="flex justify-between items-center px-6 pb-4 text-xs font-mono">
                <span className="text-white/35">
                  Mín <span style={{ color: '#FF6B7A' }}>{Math.min(...chartEjercicio.puntos.map(p => p.load))} {chartEjercicio.puntos[0]?.unit}</span>
                </span>
                <span className="text-white/35">
                  {chartEjercicio.puntos.length} registro{chartEjercicio.puntos.length === 1 ? '' : 's'}
                </span>
                <span className="text-white/35">
                  Máx <span style={{ color: '#FF6B7A' }}>{Math.max(...chartEjercicio.puntos.map(p => p.load))} {chartEjercicio.puntos[0]?.unit}</span>
                </span>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={() => setChartEjercicio(null)}
                className="w-full h-10 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
