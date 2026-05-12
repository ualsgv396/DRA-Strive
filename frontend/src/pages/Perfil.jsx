import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/ContextoAuth'
import useProfileStats from '../hooks/useProfileStats'

import FireLineIcon          from 'remixicon-react/FireLineIcon'
import RepeatLineIcon        from 'remixicon-react/RepeatLineIcon'
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
                title={
                  dia.count > 0
                    ? `${dia.key} · ${dia.count} rutina${dia.count > 1 ? 's' : ''}`
                    : dia.key
                }
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
  const [editandoAntro, setEditandoAntro] = useState(false)
  const [antro,         setAntro        ] = useState({ peso: '', altura: '', grasa: '', musculo: '' })

  // Carga datos de antropometría desde localStorage cuando el usuario esté disponible
  useEffect(() => {
    if (!usuario?.id) return
    try {
      const saved = localStorage.getItem(`strive_antro_${usuario.id}`)
      if (saved) setAntro(JSON.parse(saved))
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

  const stats = useProfileStats(rutinas)

  const guardarAntro = () => {
    if (usuario?.id) {
      localStorage.setItem(`strive_antro_${usuario.id}`, JSON.stringify(antro))
    }
    setEditandoAntro(false)
  }

  const camposAntro = [
    { key: 'peso',    label: 'Peso',    unit: 'kg', IconComp: Scales3LineIcon },
    { key: 'altura',  label: 'Altura',  unit: 'cm', IconComp: RulerLineIcon   },
    { key: 'grasa',   label: '% Grasa', unit: '%',  IconComp: PercentLineIcon },
    { key: 'musculo', label: 'Músculo', unit: 'kg', IconComp: MedalLineIcon   },
  ]

  const inicial = (usuario?.nombre || 'U').slice(0, 1).toUpperCase()

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
          <StatCard Icon={FireLineIcon}          valor={stats.totalEjercicios} label="Ejercicios" cargando={cargando} />
          <StatCard Icon={RepeatLineIcon}        valor={stats.totalSeries}     label="Series"     cargando={cargando} />
          <StatCard Icon={HeartPulseLineIcon}    valor={stats.totalReps}       label="Reps"       cargando={cargando} />
        </div>

        {/* Desglose por tipo */}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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

        {/* ── Heatmap de actividad ── */}
        <SectionLabel Icon={CalendarCheckLineIcon}>Actividad · últimos 3 meses</SectionLabel>

        <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/[0.06] mb-8">
          {cargando
            ? <div className="h-24 rounded-lg bg-white/5 animate-pulse" />
            : <HeatmapActividad actividadPorFecha={stats.actividadPorFecha} />
          }
        </div>

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
