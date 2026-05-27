import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/ContextoAuth'
import useProfileStats from '../hooks/useProfileStats'

import FireLineIcon          from 'remixicon-react/FireLineIcon'
import HeartPulseLineIcon    from 'remixicon-react/HeartPulseLineIcon'
import Scales3LineIcon       from 'remixicon-react/Scales3LineIcon'
import RulerLineIcon         from 'remixicon-react/RulerLineIcon'
import PercentLineIcon       from 'remixicon-react/PercentLineIcon'
import MedalLineIcon         from 'remixicon-react/MedalLineIcon'
import CalendarCheckLineIcon from 'remixicon-react/CalendarCheckLineIcon'
import EditLineIcon          from 'remixicon-react/EditLineIcon'
import SaveLineIcon          from 'remixicon-react/SaveLineIcon'
import TrophyLineIcon        from 'remixicon-react/TrophyLineIcon'
import RunLineIcon           from 'remixicon-react/RunLineIcon'

// ── Constantes de diseño ──────────────────────────────────────────
const RED  = '#FF414D'
const GRAY = 'rgba(255,255,255,0.40)'

// ── Gráfico de evolución de peso ─────────────────────────────────
function GraficoPeso({ historial }) {
  const puntos = historial
    .filter(h => h.peso !== '' && h.peso != null)
    .map(h => ({ fecha: h.fecha, peso: Number.parseFloat(h.peso) }))
    .filter(p => !Number.isNaN(p.peso))
    .slice(-12)

  if (puntos.length < 2) return null

  const W = 360, H = 90
  const PAD = { top: 12, right: 12, bottom: 22, left: 42 }
  const IW = W - PAD.left - PAD.right
  const IH = H - PAD.top - PAD.bottom

  const pesos = puntos.map(p => p.peso)
  const minP  = Math.min(...pesos)
  const maxP  = Math.max(...pesos)
  const rangP = maxP - minP || 1

  const cx = i  => PAD.left + (puntos.length === 1 ? IW / 2 : (i / (puntos.length - 1)) * IW)
  const cy = p  => PAD.top + IH - ((p - minP) / rangP) * IH

  const linePts  = puntos.map((p, i) => `${cx(i)},${cy(p.peso)}`).join(' ')
  const areaPts  =
    `${cx(0)},${PAD.top + IH} ` +
    puntos.map((p, i) => `${cx(i)},${cy(p.peso)}`).join(' ') +
    ` ${cx(puntos.length - 1)},${PAD.top + IH}`

  const fmtD = d => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FF414D" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FF414D" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#pesoGrad)" />
      <polyline points={linePts} fill="none" stroke="#FF414D" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <text x={PAD.left - 5} y={PAD.top + 4}       textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.32)" fontFamily="monospace">{maxP}</text>
      {minP !== maxP && (
        <text x={PAD.left - 5} y={PAD.top + IH + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.32)" fontFamily="monospace">{minP}</text>
      )}
      <text x={cx(0)}                  y={H - 4} textAnchor="start" fontSize="8" fill="rgba(255,255,255,0.26)" fontFamily="monospace">{fmtD(puntos[0].fecha)}</text>
      <text x={cx(puntos.length - 1)}  y={H - 4} textAnchor="end"   fontSize="8" fill="rgba(255,255,255,0.26)" fontFamily="monospace">{fmtD(puntos[puntos.length - 1].fecha)}</text>
      {puntos.map((p, i) => (
        <g key={p.fecha}>
          <title>{fmtD(p.fecha)} · {p.peso} kg</title>
          <circle cx={cx(i)} cy={cy(p.peso)} r={4}   fill="#FF414D" opacity="0.22" />
          <circle cx={cx(i)} cy={cy(p.peso)} r={2.5} fill="#FF414D" />
          <circle cx={cx(i)} cy={cy(p.peso)} r={1.2} fill="#fff"    />
        </g>
      ))}
    </svg>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────
const CELL = 13
const GAP  = 3

function buildDias(actividadPorFecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hoyKey  = hoy.toISOString().split('T')[0]
  const hace90  = new Date(hoy.getTime() - 90 * 864e5)

  // Retrocede hasta el lunes de la semana de inicio
  const inicio  = new Date(hace90)
  const dow     = inicio.getDay()                     // 0=Dom, 1=Lun…
  inicio.setDate(inicio.getDate() - (dow === 0 ? 6 : dow - 1))

  const dias   = []
  const cursor = new Date(inicio)

  while (cursor <= hoy) {
    const key = cursor.toISOString().split('T')[0]
    dias.push({
      key,
      date:    new Date(cursor),
      month:   cursor.getMonth(),
      count:   actividadPorFecha[key] ?? 0,
      isToday: key === hoyKey,
      inRange: cursor >= hace90,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}

function getMonthLabels(dias) {
  const labels = []
  let lastMonth = -1
  dias.forEach((d, i) => {
    if (d.month !== lastMonth && d.inRange) {
      labels.push({
        col:   Math.floor(i / 7),
        label: d.date.toLocaleString('es-ES', { month: 'short' }),
      })
      lastMonth = d.month
    }
  })
  return labels
}

function cellBg(dia) {
  if (!dia.inRange)    return 'transparent'
  if (dia.count === 0) return '#252525'
  if (dia.count === 1) return 'rgba(255,65,77,0.55)'
  return RED
}

function HeatmapActividad({ actividadPorFecha }) {
  const dias        = buildDias(actividadPorFecha)
  const monthLabels = getMonthLabels(dias)
  const labelOffset = 22   // px: ancho de columna de días + gap

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
      <div style={{ display: 'inline-block' }}>

        {/* Etiquetas de mes */}
        <div style={{ position: 'relative', height: '18px', marginLeft: labelOffset + GAP }}>
          {monthLabels.map(({ col, label }) => (
            <span
              key={`${col}-${label}`}
              style={{
                position:    'absolute',
                left:        `${col * (CELL + GAP)}px`,
                fontSize:    '10px',
                color:       'rgba(255,255,255,0.35)',
                fontFamily:  'Inter, sans-serif',
                textTransform: 'capitalize',
                whiteSpace:  'nowrap',
                lineHeight:  '18px',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Días + celdas */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: GAP + 1 }}>

          {/* Etiquetas de día (L, X, V, D) */}
          <div style={{ display: 'grid', gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP, width: 18 }}>
            {['L', '', 'X', '', 'V', '', 'D'].map((l, i) => (
              <div
                key={i}
                style={{
                  height: CELL, lineHeight: `${CELL}px`,
                  fontSize: '9px', color: 'rgba(255,255,255,0.28)',
                  fontFamily: 'Inter, sans-serif', textAlign: 'right',
                }}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Grid de celdas */}
          <div
            style={{
              display:          'grid',
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gridAutoFlow:     'column',
              gridAutoColumns:  `${CELL}px`,
              gap:              GAP,
            }}
          >
            {dias.map(dia => (
              <div
                key={dia.key}
                title={(() => {
                  if (dia.count === 0) return dia.key
                  const plural = dia.count > 1 ? 's' : ''
                  return `${dia.key} · ${dia.count} entreno${plural}`
                })()}
                style={{
                  width:           CELL,
                  height:          CELL,
                  borderRadius:    2,
                  backgroundColor: cellBg(dia),
                  outline:         dia.isToday ? `1.5px solid ${RED}` : 'none',
                  outlineOffset:   '-1px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, marginLeft: labelOffset + GAP }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'Inter, sans-serif' }}>Menos</span>
          {['#252525', 'rgba(255,65,77,0.4)', 'rgba(255,65,77,0.7)', RED].map((bg, i) => (
            <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: bg }} />
          ))}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'Inter, sans-serif' }}>Más</span>
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes de UI ─────────────────────────────────────────
function SectionLabel({ Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} color={RED} />
      <h2 className="font-['Oswald'] text-[11px] font-bold uppercase tracking-[2.5px]" style={{ color: GRAY }}>
        {children}
      </h2>
    </div>
  )
}

function StatCard({ Icon, valor, label, cargando }) {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/[0.06] flex flex-col gap-2">
      {cargando
        ? <div className="h-5 w-5 rounded bg-white/10 animate-pulse" />
        : <Icon size={20} color={RED} />
      }
      <p className="font-['Oswald'] text-[2.4rem] font-bold leading-none mt-0.5">
        {cargando ? <span className="inline-block h-8 w-12 rounded bg-white/10 animate-pulse align-middle" /> : valor}
      </p>
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-['Inter']">{label}</p>
    </div>
  )
}

function AntroCard({ IconComp, label, unit, value, editing, onChange }) {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <IconComp size={16} color={RED} />
        <span className="text-[10px] font-['Inter'] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>{unit}</span>
      </div>

      {editing ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          className="w-full bg-[#2A2A2A] text-white font-['Oswald'] text-2xl font-bold rounded-lg px-2 py-1 outline-none border border-white/10 focus:border-[#FF414D] transition-colors"
        />
      ) : (
        <p className="font-['Oswald'] text-[1.9rem] font-bold leading-none">
          {value ? value : <span className="text-white/20">—</span>}
        </p>
      )}

      <p className="text-white/35 text-[10px] uppercase tracking-widest mt-2.5 font-['Inter']">{label}</p>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────
export default function Perfil() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()

  const [rutinas,       setRutinas      ] = useState([])
  const [cargando,      setCargando     ] = useState(true)
  const [sesiones,      setSesiones     ] = useState([])
  const [cargandoSes,   setCargandoSes  ] = useState(true)
  const [editandoAntro,   setEditandoAntro  ] = useState(false)
  const [antro,           setAntro          ] = useState({ peso: '', altura: '', grasa: '', musculo: '' })
  const [antroHist,       setAntroHist      ] = useState([])
  const [metaSemanal,     setMetaSemanal     ] = useState(null)
  const [showAllRecords,  setShowAllRecords  ] = useState(false)

  // Carga datos de antropometría desde localStorage cuando el usuario esté disponible
  useEffect(() => {
    if (!usuario?.id) return
    try {
      const saved = localStorage.getItem(`strive_antro_${usuario.id}`)
      if (saved) setAntro(JSON.parse(saved))
    } catch { /* ignore */ }
    try {
      const hist = localStorage.getItem(`strive_antro_hist_${usuario.id}`)
      if (hist) setAntroHist(JSON.parse(hist))
    } catch { /* ignore */ }
    try {
      const meta = localStorage.getItem(`strive_meta_semanal_${usuario.id}`)
      if (meta) setMetaSemanal(JSON.parse(meta))
    } catch { /* ignore */ }
  }, [usuario?.id])

  // Carga rutinas del usuario
  useEffect(() => {
    if (!usuario?.id) { setCargando(false); return }
    api.get(`/routines?ownerId=${usuario.id}`)
      .then(r => setRutinas(r.data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [usuario?.id])

  // Carga historial de sesiones para stats reales
  useEffect(() => {
    api.get('/training-sessions?limit=100')
      .then(r => setSesiones(r.data ?? []))
      .catch(() => {})
      .finally(() => setCargandoSes(false))
  }, [])

  const stats = useProfileStats(rutinas)

  const guardarAntro = () => {
    if (usuario?.id) {
      localStorage.setItem(`strive_antro_${usuario.id}`, JSON.stringify(antro))
      const hayValor = Object.values(antro).some(v => v !== '')
      if (hayValor) {
        const hoy = new Date().toISOString().split('T')[0]
        const entrada = { fecha: hoy, ...antro }
        const hist = [...antroHist.filter(h => h.fecha !== hoy), entrada]
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
        setAntroHist(hist)
        localStorage.setItem(`strive_antro_hist_${usuario.id}`, JSON.stringify(hist))
      }
    }
    setEditandoAntro(false)
  }

  const handleSetMeta = (n) => {
    setMetaSemanal(n)
    if (usuario?.id) {
      localStorage.setItem(`strive_meta_semanal_${usuario.id}`, JSON.stringify(n))
    }
  }

  const camposAntro = [
    { key: 'peso',    label: 'Peso',    unit: 'kg', IconComp: Scales3LineIcon },
    { key: 'altura',  label: 'Altura',  unit: 'cm', IconComp: RulerLineIcon   },
    { key: 'grasa',   label: '% Grasa', unit: '%',  IconComp: PercentLineIcon },
    { key: 'musculo', label: 'Músculo', unit: 'kg', IconComp: MedalLineIcon   },
  ]

  const inicial = (usuario?.nombre || 'U').slice(0, 1).toUpperCase()

  // Stats de sesiones reales
  const sesionesCompletadas = sesiones.filter(s => s.status === 'COMPLETED')
  const totalSesiones = sesionesCompletadas.length
  const tiempoTotalMin = sesionesCompletadas.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
  const tiempoHoras = Math.floor(tiempoTotalMin / 60)
  const tiempoMins  = tiempoTotalMin % 60
  let tiempoLabel
  if (tiempoTotalMin < 60)  tiempoLabel = `${tiempoTotalMin}m`
  else if (tiempoMins > 0)  tiempoLabel = `${tiempoHoras}h ${tiempoMins}m`
  else                      tiempoLabel = `${tiempoHoras}h`

  const diasConEntreno = new Set(
    sesionesCompletadas.map(s => new Date(s.completedAt ?? s.startedAt).toISOString().split('T')[0])
  )
  const hoyDate = new Date()
  hoyDate.setHours(0, 0, 0, 0)
  const todayKey = hoyDate.toISOString().split('T')[0]
  let racha = 0
  const startOffset = diasConEntreno.has(todayKey) ? 0 : 1
  for (let i = startOffset; i < 365; i++) {
    const key = new Date(hoyDate.getTime() - i * 86400000).toISOString().split('T')[0]
    if (diasConEntreno.has(key)) racha++
    else break
  }

  const actividadSesiones = {}
  sesionesCompletadas.forEach(s => {
    const key = new Date(s.completedAt ?? s.startedAt).toISOString().split('T')[0]
    actividadSesiones[key] = (actividadSesiones[key] ?? 0) + 1
  })

  const lunes = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const dow = d.getDay()
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    return d
  })()
  const diasEstaSemana = new Set(
    sesionesCompletadas
      .filter(s => new Date(s.completedAt ?? s.startedAt) >= lunes)
      .map(s => new Date(s.completedAt ?? s.startedAt).toISOString().split('T')[0])
  ).size

  const recordsPersonales = useMemo(() => {
    const mejor = {}
    sesiones
      .filter(s => s.status === 'COMPLETED')
      .forEach(s => {
        (s.exercises ?? []).forEach(rec => {
          const titulo = rec.routineExercise?.exercise?.title
          if (!titulo || rec.loadCompleted == null) return
          const load = Number.parseFloat(rec.loadCompleted)
          if (Number.isNaN(load) || load <= 0) return
          const unit = rec.loadUnit ?? 'KG'
          if (unit !== 'KG') return
          const prev = mejor[titulo]
          if (!prev || load > prev.load) {
            mejor[titulo] = {
              titulo,
              load,
              unit,
              sets: rec.setsCompleted,
              reps: rec.repsCompleted,
              fecha: s.completedAt ?? s.startedAt,
            }
          }
        })
      })
    return Object.values(mejor).sort((a, b) => b.load - a.load)
  }, [sesiones])

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* ── Título ── */}
        <h1 className="font-['Oswald'] text-5xl font-bold uppercase mb-1 tracking-tight">Perfil</h1>
        <p className="text-white/40 text-sm font-['Inter'] mb-8">Tu cuenta y estadísticas de entrenamiento</p>

        {/* ── Tarjeta de usuario ── */}
        <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center font-['Oswald'] text-2xl font-bold"
            style={{ backgroundColor: 'rgba(255,65,77,0.12)', color: RED }}
          >
            {inicial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white truncate">{usuario?.nombre || 'Usuario Strive'}</p>
            <p className="text-sm font-['Inter'] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {usuario?.email || '—'}
            </p>
            {usuario?.nickname && (
              <p className="text-xs font-['Inter'] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                @{usuario.nickname}
              </p>
            )}
          </div>

          <span
            className="flex-shrink-0 text-[10px] font-['Oswald'] font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
            style={{ color: RED, backgroundColor: 'rgba(255,65,77,0.10)', borderColor: 'rgba(255,65,77,0.25)' }}
          >
            {usuario?.rol || 'USER'}
          </span>
        </div>

        {/* ── Estadísticas de Poder ── */}
        <SectionLabel Icon={TrophyLineIcon}>Estadísticas de Poder</SectionLabel>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatCard Icon={CalendarCheckLineIcon} valor={totalSesiones} label="Entrenos"    cargando={cargandoSes} />
          <StatCard Icon={HeartPulseLineIcon}    valor={tiempoLabel}   label="Tiempo total" cargando={cargandoSes} />
          <StatCard Icon={FireLineIcon}          valor={`${racha}d`}   label="Racha"       cargando={cargandoSes} />
        </div>

        {/* Desglose por tipo (desde rutinas) */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-8 pl-1 font-['Inter'] text-xs" style={{ color: GRAY }}>
          <span className="flex items-center gap-1.5">
            <TrophyLineIcon size={11} color={RED} />
            {stats.fuerza} Fuerza
          </span>
          <span className="flex items-center gap-1.5">
            <RunLineIcon size={11} color="#4ECDC4" />
            {stats.cardio} Cardio
          </span>
          <span className="flex items-center gap-1.5">
            <HeartPulseLineIcon size={11} color="#FF8C42" />
            {stats.movilidad} Movilidad
          </span>
          {!cargando && rutinas.length > 0 && (
            <span className="flex items-center gap-1.5 ml-auto">
              {rutinas.length} rutina{rutinas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Meta semanal ── */}
        <SectionLabel Icon={CalendarCheckLineIcon}>Meta semanal</SectionLabel>
        <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/[0.06] mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-['Oswald'] font-bold text-lg leading-none text-white">
                {diasEstaSemana}
                {metaSemanal && (
                  <span className="font-normal text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}> / {metaSemanal}</span>
                )}
              </p>
              <p className="text-[10px] font-['Inter'] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {metaSemanal && diasEstaSemana >= metaSemanal
                  ? '¡Meta alcanzada esta semana!'
                  : 'Días entrenados esta semana'}
              </p>
            </div>
            {metaSemanal && diasEstaSemana >= metaSemanal && (
              <TrophyLineIcon size={18} color={RED} />
            )}
          </div>

          <div className="flex gap-1.5 mb-5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: 5,
                  backgroundColor: i < diasEstaSemana ? RED : 'rgba(255,255,255,0.07)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>

          <p className="text-[10px] font-['Inter'] mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Días por semana
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <button
                key={n}
                onClick={() => handleSetMeta(n)}
                className="flex-1 h-9 rounded-lg font-['Oswald'] font-bold text-sm transition-all"
                style={{
                  backgroundColor: metaSemanal === n ? RED : 'rgba(255,255,255,0.05)',
                  color: metaSemanal === n ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: `1px solid ${metaSemanal === n ? 'rgba(255,65,77,0.50)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ── Antropometría ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scales3LineIcon size={15} color={RED} />
            <h2 className="font-['Oswald'] text-[11px] font-bold uppercase tracking-[2.5px]" style={{ color: GRAY }}>
              Antropometría
            </h2>
          </div>

          {editandoAntro ? (
            <button
              onClick={guardarAntro}
              className="flex items-center gap-1.5 text-[11px] font-['Oswald'] font-bold uppercase tracking-wider transition-colors"
              style={{ color: RED }}
            >
              <SaveLineIcon size={13} color={RED} />
              Guardar
            </button>
          ) : (
            <button
              onClick={() => setEditandoAntro(true)}
              className="flex items-center gap-1.5 text-[11px] font-['Oswald'] font-bold uppercase tracking-wider hover:text-white transition-colors"
              style={{ color: GRAY }}
            >
              <EditLineIcon size={13} color={GRAY} />
              Editar
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {camposAntro.map(({ key, label, unit, IconComp }) => (
            <AntroCard
              key={key}
              IconComp={IconComp}
              label={label}
              unit={unit}
              value={antro[key]}
              editing={editandoAntro}
              onChange={val => setAntro(prev => ({ ...prev, [key]: val }))}
            />
          ))}
        </div>

        {/* Gráfico evolución de peso */}
        {antroHist.filter(h => h.peso !== '').length >= 2 && (
          <div className="bg-[#1E1E1E] rounded-2xl px-5 pt-4 pb-3 border border-white/[0.06] mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] uppercase tracking-[1.4px] text-white/35">
                Evolución de peso
              </p>
              <p className="font-['Oswald'] text-sm font-bold" style={{ color: RED }}>
                {antro.peso ? `${antro.peso} kg` : '—'}
              </p>
            </div>
            <GraficoPeso historial={antroHist} />
          </div>
        )}

        {/* ── Heatmap de actividad ── */}
        <SectionLabel Icon={CalendarCheckLineIcon}>Actividad · últimos 3 meses</SectionLabel>

        <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/[0.06] mb-8">
          {cargandoSes
            ? <div className="h-24 rounded-lg bg-white/5 animate-pulse" />
            : <HeatmapActividad actividadPorFecha={actividadSesiones} />
          }
        </div>

        {/* ── Records personales ── */}
        {recordsPersonales.length > 0 && (
          <>
            <SectionLabel Icon={TrophyLineIcon}>Records personales · últimas 30 sesiones</SectionLabel>
            <div className="bg-[#1E1E1E] rounded-2xl border border-white/[0.06] mb-8 overflow-hidden">
              {recordsPersonales
                .slice(0, showAllRecords ? undefined : 5)
                .map((pr, i) => (
                  <div
                    key={pr.titulo}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0"
                  >
                    <span className="font-mono text-[10px] w-5 shrink-0" style={{ color: 'rgba(255,255,255,0.20)' }}>
                      {i + 1}
                    </span>
                    <span className="font-['Oswald'] text-sm font-semibold uppercase truncate flex-1">
                      {pr.titulo}
                    </span>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono text-[11px] text-white/40">
                        {pr.sets} × {pr.reps}
                      </span>
                      <span
                        className="font-['Oswald'] text-[15px] font-bold"
                        style={{ color: RED }}
                      >
                        {pr.load} {pr.unit}
                      </span>
                    </div>
                  </div>
                ))}
              {recordsPersonales.length > 5 && (
                <button
                  onClick={() => setShowAllRecords(v => !v)}
                  className="w-full py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-white/60"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  {showAllRecords ? 'Ver menos ↑' : `Ver todos (${recordsPersonales.length}) ↓`}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Acciones rápidas ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/rutina/nueva')}
            className="flex-1 py-4 rounded-xl font-['Oswald'] font-bold text-sm uppercase tracking-wider transition-colors"
            style={{ backgroundColor: RED, color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0363f'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = RED}
          >
            + Nueva rutina
          </button>
          <button
            onClick={() => navigate('/panel')}
            className="flex-1 py-4 rounded-xl font-['Oswald'] font-bold text-sm uppercase tracking-wider border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Ver mis rutinas
          </button>
        </div>

      </div>
    </div>
  )
}
