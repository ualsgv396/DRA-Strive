import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout, { IconBars, IconUsers, formatBadge } from '../../components/admin/AdminLayout'
import api from '../../api/axios'

// ── Charts ─────────────────────────────────────────────────────────────────────

function MiniLineChart({ data = [], color = '#00C9A7', w = 110, h = 44 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const rng = max - min || 1
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - 4 - ((v - min) / rng) * (h - 8)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  )
}

function MiniBarChart({ data = {}, color = '#E63946', w = 110, h = 48 }) {
  const values = Object.values(data)
  if (!values.length) return <div style={{ width: w, height: h }} />
  const max = Math.max(...values, 1)
  const n = values.length
  const gap = 3
  const barW = Math.floor((w - gap * (n - 1)) / n)
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      {values.map((v, i) => {
        const barH = Math.max(3, (v / max) * h)
        return (
          <rect key={`bar-${i}`} x={i * (barW + gap)} y={h - barH}
            width={barW} height={barH} fill={color} rx="2"
            opacity={i === n - 1 ? 1 : 0.4} />
        )
      })}
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatNum = n => {
  if (n == null) return '—'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const exportarCSV = data => {
  if (!data) return
  const filas = [
    ['Métrica', 'Valor'],
    ['Usuarios totales', data.totalUsuarios],
    ['Ejercicios en catálogo', data.totalEjercicios],
    ['Rutinas creadas', data.totalRutinas],
    ['Sesiones (7 días)', data.totalSesiones7Dias],
    ['Tasa crecimiento usuarios', `${data.tasaCrecimientoUsuarios}%`],
    ['Tasa crecimiento sesiones', `${data.tasaCrecimientoSesiones}%`],
    ['Usuarios nuevos este mes', data.usuariosNuevosEsteMes],
    ['Rutinas nuevas este mes', data.rutinasNuevasEsteMes],
    ['Flash activos', data.flashActivos],
    ['Flash caducan pronto', data.flashCaducanProximamente],
  ]
  const csv = filas.map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `strive-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Metric Card ────────────────────────────────────────────────────────────────

function MetricCard({ titulo, subtitulo, valor, badge, badgePositivo = true, extraTexto, chart, cargando }) {
  return (
    <div className="bg-[#161616] rounded-2xl p-5 border border-white/[0.06] flex flex-col gap-2 min-h-[148px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white/55 text-sm font-medium">{titulo}</p>
        {subtitulo && (
          <p className="text-white/22 text-[9px] font-bold uppercase tracking-widest text-right leading-[1.4] whitespace-pre-line flex-shrink-0">
            {subtitulo}
          </p>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 flex-1">
        <div className="flex flex-col gap-1.5">
          <p className="font-['Oswald'] text-[2.6rem] font-bold leading-none tracking-tight text-white">
            {cargando ? <span className="text-white/15 text-3xl">—</span> : formatNum(valor)}
          </p>
          {badge != null && (
            <span className={`inline-flex items-center gap-1 w-fit text-[11px] font-bold px-2 py-0.5 rounded-full ${badgePositivo ? 'bg-[#00C9A7]/12 text-[#00C9A7]' : 'bg-[#E63946]/12 text-[#E63946]'}`}>
              {badgePositivo ? '▲' : '▼'} {badge}
            </span>
          )}
          {extraTexto && <p className="text-white/28 text-xs leading-snug">{extraTexto}</p>}
        </div>
        {chart && <div className="pb-1">{chart}</div>}
      </div>
    </div>
  )
}

// ── Quick Action Card ──────────────────────────────────────────────────────────

function AccionCard({ icono, titulo, subtitulo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[#161616] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.14] transition-all group min-h-[80px] flex items-center"
    >
      <div className="flex items-center gap-4 w-full">
        <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
          {icono}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-['Oswald'] font-bold uppercase text-white/85 text-[15px] tracking-wide group-hover:text-white transition-colors">
            {titulo}
          </p>
          <p className="text-white/30 text-xs mt-0.5 truncate">{subtitulo}</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/18 group-hover:text-white/45 transition-colors flex-shrink-0">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </button>
  )
}

// ── Activity Feed ──────────────────────────────────────────────────────────────

const CONFIG_TIPO = {
  USUARIO_NUEVO:   { etiqueta: 'USUARIO NUEVO', color: '#00C9A7' },
  RUTINA_CREADA:   { etiqueta: 'RUTINA CREADA',  color: '#E63946' },
  SESION_INICIADA: { etiqueta: 'SESIÓN',          color: 'rgba(255,255,255,0.6)' },
}

const tiempoRelativo = iso => {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function EventoActividad({ evento }) {
  const cfg = CONFIG_TIPO[evento.tipo] ?? { etiqueta: evento.tipo, color: 'rgba(255,255,255,0.4)' }
  const texto = evento.tipo === 'USUARIO_NUEVO'
    ? `${evento.actor} ${evento.descripcion}`
    : `${evento.actor} · ${evento.descripcion}`
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>{cfg.etiqueta}</p>
        <p className="text-white/65 text-sm leading-snug">{texto}</p>
      </div>
      <span className="text-white/22 text-xs flex-shrink-0 mt-0.5">{tiempoRelativo(evento.timestamp)}</span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

const PERIODOS = ['7d', '30d', '98d', '1a']

export default function PanelAdmin() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('30d')

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setDatos(r.data))
      .catch(e => console.error('Error cargando dashboard:', e))
      .finally(() => setCargando(false))
  }, [])

  const tasaSesionesPositiva = (datos?.tasaCrecimientoSesiones ?? 0) >= 0
  const tasaUsuariosPositiva = (datos?.tasaCrecimientoUsuarios ?? 0) >= 0

  return (
    <AdminLayout
      paginaActiva="dashboard"
      breadcrumb={['Admin', 'Dashboard']}
      cuentas={{ ejercicios: datos?.totalEjercicios, usuarios: datos?.totalUsuarios }}
    >
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">Insights · Vista General</p>
          <h1 className="font-['Oswald'] text-5xl font-bold uppercase tracking-tight leading-none">Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p} type="button" onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${periodo === p ? 'bg-[#E63946] text-white shadow-lg shadow-[#E63946]/25' : 'bg-white/[0.05] text-white/35 hover:bg-white/[0.09] hover:text-white/55'}`}>
              {p}
            </button>
          ))}
          <button type="button" onClick={() => exportarCSV(datos)} disabled={cargando || !datos}
            className="ml-1 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white/75 transition-all border border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <MetricCard titulo="Usuarios totales" subtitulo={'TODOS LOS\nTIEMPOS'}
          valor={datos?.totalUsuarios}
          badge={datos ? `${datos.tasaCrecimientoUsuarios}%` : undefined}
          badgePositivo={tasaUsuariosPositiva}
          extraTexto={datos ? `+${datos.usuariosNuevosEsteMes} nuevos este mes` : undefined}
          chart={<MiniLineChart data={datos?.tendenciaUsuarios} color="#E63946" />}
          cargando={cargando} />

        <MetricCard titulo="Ejercicios" subtitulo={'EN\nCATÁLOGO'}
          valor={datos?.totalEjercicios} cargando={cargando} />

        <MetricCard titulo="Rutinas" subtitulo={'CREADAS\nTOTAL'}
          valor={datos?.totalRutinas}
          badge={datos?.rutinasNuevasEsteMes} badgePositivo={true}
          chart={<MiniLineChart data={datos?.tendenciaRutinas} color="#F4A340" />}
          cargando={cargando} />

        <MetricCard titulo="Sesiones" subtitulo={'ÚLTIMOS\n7 DÍAS'}
          valor={datos?.totalSesiones7Dias}
          badge={datos ? `${Math.abs(datos.tasaCrecimientoSesiones)}%` : undefined}
          badgePositivo={tasaSesionesPositiva}
          chart={<MiniBarChart data={datos?.sesionesPorDia ?? {}} color="#E63946" />}
          cargando={cargando} />

        <MetricCard titulo="Flash Training" subtitulo={'ACTIVOS\nAHORA'}
          valor={datos?.flashActivos}
          extraTexto={datos ? `Caducan en las próximas 24h: ${datos.flashCaducanProximamente}` : undefined}
          cargando={cargando} />

        {/* Actividad reciente — row-span-2 en lg */}
        <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2 bg-[#161616] rounded-2xl border border-white/[0.06] flex flex-col overflow-hidden min-h-[200px] lg:min-h-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
            <p className="text-white/55 text-sm font-medium">Actividad reciente</p>
            {!cargando && datos && (
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                {datos.actividadReciente?.length ?? 0} eventos
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-1">
            {cargando ? (
              <div className="flex items-center justify-center h-28 text-white/20 text-sm">Cargando…</div>
            ) : datos?.actividadReciente?.length ? (
              datos.actividadReciente.map((evt, i) => (
                <EventoActividad key={`evt-${i}`} evento={evt} />
              ))
            ) : (
              <div className="flex items-center justify-center h-28 text-white/20 text-sm">Sin actividad reciente</div>
            )}
          </div>
        </div>

        <AccionCard icono={<IconBars size={20} />} titulo="Gestionar ejercicios"
          subtitulo={datos ? `${formatNum(datos.totalEjercicios)} en catálogo` : '—'}
          onClick={() => navigate('/admin/ejercicios')} />

        <AccionCard icono={<IconUsers size={20} />} titulo="Gestionar usuarios"
          subtitulo={datos ? `${formatNum(datos.totalUsuarios)} registrados` : '—'}
          onClick={() => navigate('/admin/usuarios')} />

      </div>
    </AdminLayout>
  )
}
