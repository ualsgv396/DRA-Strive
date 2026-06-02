import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import SuspenderUsuarioModal from '../../components/admin/SuspenderUsuarioModal'
import api from '../../api/axios'

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatNum = n => {
  if (n == null) return '—'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const formatUltimaVez = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  const months = Math.floor(days / 30)

  if (mins < 1) return 'Ahora'
  if (hrs < 1) return `Hace ${mins}m`
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (d >= todayStart) {
    return `Hoy · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (hrs < 24) return `Hace ${hrs}h`
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days}d`
  if (months === 1) return 'Hace 1 mes'
  return `Hace ${months} meses`
}

const AVATAR_COLORS = [
  '#E63946', '#2A9D8F', '#E9A64A', '#457B9D', '#8338EC',
  '#06D6A0', '#FB5607', '#3A86FF', '#FF006E', '#B5838D',
]

const getAvatarColor = str => {
  if (!str) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-white/30 text-[11px] uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className="text-white/65 text-xs text-right leading-relaxed">{value || '—'}</span>
    </div>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVO:     { label: 'Activo',     dot: '#00C9A7', bg: 'bg-[#00C9A7]/10', text: 'text-[#00C9A7]' },
  NUEVO:      { label: 'Nuevo',      dot: '#3B82F6', bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  SUSPENDIDO: { label: 'Suspendido', dot: '#E63946', bg: 'bg-[#E63946]/10',  text: 'text-[#E63946]' },
  INACTIVO:   { label: 'Inactivo',   dot: '#6B7280', bg: 'bg-white/[0.06]',  text: 'text-white/35' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVO
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function RolBadge({ rol }) {
  const esAdmin = rol === 'ADMIN'
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${esAdmin ? 'bg-[#E63946]/15 text-[#E63946]' : 'bg-white/[0.07] text-white/45'}`}>
      {rol}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({ label, valor, extra, badgeTexto, badgePositivo = true, cargando }) {
  return (
    <div className="bg-[#161616] rounded-xl px-5 py-4 border border-white/[0.06] flex-1 min-w-0">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end gap-2 flex-wrap">
        <p className="font-['Oswald'] text-3xl font-bold leading-none text-white">
          {cargando ? <span className="text-white/15">—</span> : formatNum(valor)}
        </p>
        {extra && <p className="text-white/35 text-xs mb-0.5">{extra}</p>}
        {badgeTexto != null && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 ${badgePositivo ? 'bg-[#00C9A7]/12 text-[#00C9A7]' : 'bg-[#E63946]/12 text-[#E63946]'}`}>
            {badgePositivo ? '+' : ''}{badgeTexto}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
)

const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// ── Main Component ─────────────────────────────────────────────────────────────

const ESTADOS  = ['Todos', 'Activos', 'Nuevos', 'Suspend.', 'Inactivos']
const ROLES    = ['Todos', 'USER', 'ADMIN']
const TAMANIOS = [25, 50, 100]

const ESTADO_MAP = {
  'Todos': 'TODOS', 'Activos': 'ACTIVOS', 'Nuevos': 'NUEVOS',
  'Suspend.': 'SUSPENDIDOS', 'Inactivos': 'INACTIVOS',
}

export default function GestionUsuarios() {
  const esAdminTarget = (u) => u.role === 'ADMIN'

  const [usuarios,       setUsuarios]       = useState([])
  const [stats,          setStats]          = useState(null)
  const [cargando,       setCargando]       = useState(true)
  const [cargandoStats,  setCargandoStats]  = useState(true)
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroEstado,   setFiltroEstado]   = useState('Todos')
  const [filtroRol,      setFiltroRol]      = useState('Todos')
  const [pagina,         setPagina]         = useState(0)
  const [tamano,         setTamano]         = useState(25)
  const [totalElements,  setTotalElements]  = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [seleccionados,  setSeleccionados]  = useState(new Set())
  const [modalUsuario,   setModalUsuario]   = useState(null)
  const [suspendiendo,   setSuspendiendo]   = useState(false)
  const [modalEliminar,  setModalEliminar]  = useState(null)
  const [eliminandoUser, setEliminandoUser] = useState(false)
  const [errorEliminar,  setErrorEliminar]  = useState('')
  const [modalEditar,    setModalEditar]    = useState(null)
  const [rolEditar,      setRolEditar]      = useState('')
  const [guardandoRol,   setGuardandoRol]   = useState(false)
  const [errorEditar,    setErrorEditar]    = useState('')
  const [panelPerfil,    setPanelPerfil]    = useState(null)
  const [busquedaDebounce, setBusquedaDebounce] = useState('')

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounce(busqueda), 350)
    return () => clearTimeout(t)
  }, [busqueda])

  // Cargar stats KPI
  useEffect(() => {
    api.get('/admin/users/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setCargandoStats(false))
  }, [])

  // Cargar tabla
  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        search: busquedaDebounce,
        status: ESTADO_MAP[filtroEstado] ?? 'TODOS',
        role:   filtroRol === 'Todos' ? 'TODOS' : filtroRol,
        page:   pagina,
        size:   tamano,
      })
      const r = await api.get(`/admin/users?${params}`)
      setUsuarios(r.data.content)
      setTotalElements(r.data.totalElements)
      setTotalPages(r.data.totalPages)
      setSeleccionados(new Set())
    } catch (e) {
      console.error('Error cargando usuarios:', e)
    } finally {
      setCargando(false)
    }
  }, [busquedaDebounce, filtroEstado, filtroRol, pagina, tamano])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  // Reset a página 0 cuando cambian los filtros
  useEffect(() => { setPagina(0) }, [busquedaDebounce, filtroEstado, filtroRol, tamano])

  // ── Acciones ──

  const handleSuspender = async (motivo) => {
    if (!modalUsuario) return
    setSuspendiendo(true)
    try {
      await api.patch(`/admin/users/${modalUsuario.id}/suspend`, { reason: motivo || null })
      setModalUsuario(null)
      await cargarUsuarios()
      // Refrescar stats
      api.get('/admin/users/stats').then(r => setStats(r.data)).catch(() => {})
    } catch (e) {
      console.error('Error suspendiendo:', e)
    } finally {
      setSuspendiendo(false)
    }
  }

  const handleEliminar = async () => {
    if (!modalEliminar) return
    setEliminandoUser(true)
    setErrorEliminar('')
    try {
      await api.delete(`/admin/users/${modalEliminar.id}`)
      setModalEliminar(null)
      await cargarUsuarios()
      api.get('/admin/users/stats').then(r => setStats(r.data)).catch(() => {})
    } catch (e) {
      setErrorEliminar(e.response?.data?.message || 'Error al eliminar el usuario')
    } finally {
      setEliminandoUser(false)
    }
  }

  const handleCambiarRol = async () => {
    if (!modalEditar || rolEditar === modalEditar.role) return
    setGuardandoRol(true)
    setErrorEditar('')
    try {
      await api.patch(`/admin/users/${modalEditar.id}/role`, { role: rolEditar })
      setModalEditar(null)
      await cargarUsuarios()
      api.get('/admin/users/stats').then(r => setStats(r.data)).catch(() => {})
    } catch (e) {
      setErrorEditar(e.response?.data?.message || 'Error al cambiar el rol')
    } finally {
      setGuardandoRol(false)
    }
  }

  const handleActivar = async (usuario) => {
    try {
      await api.patch(`/admin/users/${usuario.id}/activate`)
      await cargarUsuarios()
      api.get('/admin/users/stats').then(r => setStats(r.data)).catch(() => {})
    } catch (e) {
      console.error('Error activando:', e)
    }
  }

  // ── Selección ──

  const toggleSeleccion = id => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleTodos = () => {
    if (seleccionados.size === usuarios.length && usuarios.length > 0) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(usuarios.map(u => u.id)))
    }
  }

  // ── Paginación ──

  const inicio = pagina * tamano + 1
  const fin    = Math.min((pagina + 1) * tamano, totalElements)

  const exportarCSVUsuarios = () => {
    if (!usuarios.length) return
    const cols = [
      'Nombre', 'Email', 'Nickname', 'Rol', 'Estado',
      'Rutinas', 'Sesiones', 'Última actividad', 'Registrado',
      'Suspendido', 'Motivo suspensión',
    ]
    const filas = usuarios.map(u => [
      u.fullName ?? '',
      u.email ?? '',
      u.nickname ?? '',
      u.role ?? '',
      u.status ?? '',
      u.rutinasCount ?? 0,
      u.sesionesCount ?? 0,
      u.lastSeenAt  ? new Date(u.lastSeenAt).toLocaleString('es-ES')   : '',
      u.createdAt   ? new Date(u.createdAt).toLocaleDateString('es-ES') : '',
      u.suspended ? 'Sí' : 'No',
      u.suspendedReason ?? '',
    ])
    const csv = [cols, ...filas]
      .map(fila => fila.map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `strive-usuarios-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paginasVisibles = () => {
    const ps = []
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) ps.push(i)
    } else {
      ps.push(0)
      if (pagina > 2) ps.push('...')
      for (let i = Math.max(1, pagina - 1); i <= Math.min(totalPages - 2, pagina + 1); i++) ps.push(i)
      if (pagina < totalPages - 3) ps.push('...')
      ps.push(totalPages - 1)
    }
    return ps
  }

  return (
    <AdminLayout
      paginaActiva="usuarios"
      breadcrumb={['Admin', 'Personas', 'Usuarios']}
      cuentas={{ usuarios: stats?.total }}
    >

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Personas · Nuevo</p>
          <h1 className="font-['Oswald'] text-5xl font-bold uppercase tracking-tight leading-none mb-2">Usuarios</h1>
          {stats && (
            <p className="text-white/35 text-sm">
              <span className="text-white/60 font-medium">{formatNum(stats.total)}</span> registrados ·{' '}
              <span className="text-[#00C9A7] font-medium">{formatNum(stats.activos30d)}</span> activos ·{' '}
              <span className="text-[#E63946] font-medium">{formatNum(stats.suspendidos)}</span> suspendidos
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button"
            onClick={exportarCSVUsuarios}
            disabled={cargando || !usuarios.length}
            className="px-4 py-2 rounded-lg bg-white/[0.07] text-white/55 text-sm font-medium hover:bg-white/[0.12] transition-all border border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed">
            Exportar CSV
          </button>
          <button type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#c8303c] text-white text-sm font-bold transition-all shadow-lg shadow-[#E63946]/20">
            <IconPlus />
            <span className="font-['Oswald'] uppercase tracking-wide">Invitar usuario</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <KpiCard label="Total"        valor={stats?.total}      extra={`+${formatNum(stats?.nuevos7d)} este mes`} cargando={cargandoStats} />
        <KpiCard label="Activos 30d"  valor={stats?.activos30d} extra={`${stats?.tasaActivos30d ?? 0}%`} cargando={cargandoStats} />
        <KpiCard label="Nuevos 7d"    valor={stats?.nuevos7d}
          badgeTexto={stats ? `${stats.tasaNuevos7d > 0 ? '+' : ''}${stats.tasaNuevos7d}%` : undefined}
          badgePositivo={(stats?.tasaNuevos7d ?? 0) >= 0} cargando={cargandoStats} />
        <KpiCard label="Suspendidos"  valor={stats?.suspendidos} extra="reportes" cargando={cargandoStats} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Filtros estado */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-white/25 text-[10px] font-bold uppercase tracking-widest mr-1">Estado</span>
          {ESTADOS.map(e => (
            <button key={e} type="button" onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEstado === e ? 'bg-[#E63946] text-white' : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.09] hover:text-white/60'}`}>
              {e}
            </button>
          ))}
        </div>

        {/* Filtros rol */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-white/25 text-[10px] font-bold uppercase tracking-widest mr-1">Rol</span>
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => setFiltroRol(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroRol === r ? 'bg-[#E63946] text-white' : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.09] hover:text-white/60'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#161616] rounded-2xl border border-white/[0.06] overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={seleccionados.size === usuarios.length && usuarios.length > 0}
                    onChange={toggleTodos}
                    className="w-3.5 h-3.5 rounded accent-[#E63946] cursor-pointer"
                  />
                </th>
                {['USUARIO', 'ROL', 'ESTADO', 'RUTINAS', 'SESIONES', 'ÚLTIMA VEZ', 'ACCIONES'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/25 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-white/[0.04]">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-white/25 text-sm">
                    No se encontraron usuarios con los filtros aplicados
                  </td>
                </tr>
              ) : (
                usuarios.map(u => {
                  const inicial = (u.fullName || u.email || '?')[0].toUpperCase()
                  const color   = getAvatarColor(u.fullName || u.email)
                  const selec   = seleccionados.has(u.id)
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/[0.04] last:border-0 transition-colors ${selec ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selec}
                          onChange={() => toggleSeleccion(u.id)}
                          className="w-3.5 h-3.5 rounded accent-[#E63946] cursor-pointer"
                        />
                      </td>

                      {/* Usuario */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                            style={{ backgroundColor: color + '33', border: `1.5px solid ${color}55` }}
                          >
                            <span style={{ color }}>{inicial}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/85 font-medium truncate leading-tight">{u.fullName}</p>
                            <p className="text-white/30 text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RolBadge rol={u.role} />
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={u.status} />
                      </td>

                      {/* Rutinas */}
                      <td className="px-4 py-3 text-white/60 font-semibold text-right pr-6 whitespace-nowrap">
                        {u.rutinasCount}
                      </td>

                      {/* Sesiones */}
                      <td className="px-4 py-3 text-white/60 font-semibold text-right pr-6 whitespace-nowrap">
                        {u.sesionesCount}
                      </td>

                      {/* Última vez */}
                      <td className="px-4 py-3 text-white/35 text-xs whitespace-nowrap">
                        {formatUltimaVez(u.lastSeenAt)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" title="Ver perfil"
                            onClick={() => setPanelPerfil(u)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.07] transition-all">
                            <IconEye />
                          </button>
                          <button type="button"
                            title={esAdminTarget(u) ? 'No disponible para administradores' : 'Cambiar rol'}
                            disabled={esAdminTarget(u)}
                            onClick={() => { setModalEditar(u); setRolEditar(u.role); setErrorEditar('') }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.07] transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                            <IconEdit />
                          </button>
                          {u.suspended ? (
                            <button type="button"
                              title={esAdminTarget(u) ? 'No disponible para administradores' : 'Reactivar usuario'}
                              disabled={esAdminTarget(u)}
                              onClick={() => handleActivar(u)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#00C9A7]/50 hover:text-[#00C9A7] hover:bg-[#00C9A7]/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                              <IconPlay />
                            </button>
                          ) : (
                            <button type="button"
                              title={esAdminTarget(u) ? 'No disponible para administradores' : 'Suspender usuario'}
                              disabled={esAdminTarget(u)}
                              onClick={() => setModalUsuario(u)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-orange-400 hover:bg-orange-500/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                              <IconPause />
                            </button>
                          )}
                          <button type="button"
                            title={esAdminTarget(u) ? 'No disponible para administradores' : 'Eliminar usuario'}
                            disabled={esAdminTarget(u)}
                            onClick={() => { setModalEliminar(u); setErrorEliminar('') }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-[#E63946] hover:bg-[#E63946]/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla / Paginación */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <p className="text-white/30 text-xs">
              {totalElements > 0
                ? `Mostrando ${formatNum(inicio)}-${formatNum(fin)} de ${formatNum(totalElements)}`
                : 'Sin resultados'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filas por página */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/25 text-[10px] font-bold uppercase tracking-widest">Filas</span>
              {TAMANIOS.map(t => (
                <button key={t} type="button" onClick={() => setTamano(t)}
                  className={`w-8 h-6 rounded text-[11px] font-bold transition-all ${tamano === t ? 'bg-[#E63946] text-white' : 'bg-white/[0.05] text-white/35 hover:bg-white/[0.09]'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Páginas */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>

                {paginasVisibles().map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="text-white/20 text-xs px-1">…</span>
                  ) : (
                    <button key={p} type="button" onClick={() => setPagina(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${pagina === p ? 'bg-[#E63946] text-white' : 'text-white/40 hover:bg-white/[0.07] hover:text-white'}`}>
                      {p + 1}
                    </button>
                  )
                )}

                <button type="button" onClick={() => setPagina(p => Math.min(totalPages - 1, p + 1))} disabled={pagina >= totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal suspensión */}
      {modalUsuario && (
        <SuspenderUsuarioModal
          usuario={modalUsuario}
          onConfirmar={handleSuspender}
          onCancelar={() => setModalUsuario(null)}
          cargando={suspendiendo}
        />
      )}

      {/* Modal eliminar usuario */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div
            className="bg-[#161616] rounded-2xl w-full max-w-sm border border-[#E63946]/25 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(230,57,70,0.12), 0 25px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="p-7">
              <div
                className="w-12 h-12 rounded-xl bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center mb-5 text-[#E63946]"
                style={{ boxShadow: '0 0 16px rgba(230,57,70,0.2)' }}
              >
                <IconTrash />
              </div>

              <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-2 tracking-wide">
                ¿Eliminar usuario?
              </h3>
              <p className="text-white/55 text-sm leading-relaxed mb-1">
                Se eliminará permanentemente la cuenta de{' '}
                <span className="text-white font-semibold">{modalEliminar.fullName}</span>.
              </p>
              <p className="text-white/30 text-xs mb-5">{modalEliminar.email}</p>

              <ul className="flex flex-col gap-2 mb-5">
                {[
                  'Se perderán todas sus rutinas y sesiones de entrenamiento',
                  'Esta acción no se puede deshacer',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {errorEliminar && (
                <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg px-4 py-3 text-[#E63946] text-sm mb-2">
                  {errorEliminar}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-7 py-5 border-t border-white/[0.06] bg-[#111111]">
              <button
                type="button"
                onClick={() => { setModalEliminar(null); setErrorEliminar('') }}
                className="flex-1 bg-[#1E1E1E] border border-white/10 text-white/65 py-3 rounded-xl text-sm font-semibold hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={eliminandoUser}
                className="flex-1 bg-[#E63946] hover:bg-[#c8303c] text-white py-3 rounded-xl font-['Oswald'] font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-60"
              >
                {eliminandoUser ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar rol */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div
            className="bg-[#161616] rounded-2xl w-full max-w-sm border border-white/[0.08] overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="p-7">
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
                Editar usuario
              </p>

              {/* Info usuario */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.06]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    backgroundColor: `${getAvatarColor(modalEditar.fullName || modalEditar.email)}33`,
                    border: `1.5px solid ${getAvatarColor(modalEditar.fullName || modalEditar.email)}55`,
                    color: getAvatarColor(modalEditar.fullName || modalEditar.email),
                  }}
                >
                  {(modalEditar.fullName || modalEditar.email || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{modalEditar.fullName}</p>
                  <p className="text-white/30 text-xs truncate">{modalEditar.email}</p>
                </div>
              </div>

              {/* Selector de rol */}
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">Rol</p>
              <div className="flex gap-2 mb-5">
                {['USER', 'ADMIN'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRolEditar(r)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold font-['Oswald'] uppercase tracking-wider transition-all ${
                      rolEditar === r
                        ? 'bg-[#E63946] text-white shadow-lg shadow-[#E63946]/20'
                        : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.09] hover:text-white/65'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {rolEditar === modalEditar.role ? null : (
                <p className="text-white/35 text-xs mb-4 leading-relaxed">
                  {rolEditar === 'ADMIN'
                    ? '⚠ El usuario obtendrá acceso completo al panel de administración.'
                    : '⚠ El usuario perderá el acceso al panel de administración.'}
                </p>
              )}

              {errorEditar && (
                <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg px-4 py-3 text-[#E63946] text-sm">
                  {errorEditar}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-7 py-5 border-t border-white/[0.06] bg-[#111111]">
              <button
                type="button"
                onClick={() => { setModalEditar(null); setErrorEditar('') }}
                className="flex-1 bg-[#1E1E1E] border border-white/10 text-white/65 py-3 rounded-xl text-sm font-semibold hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCambiarRol}
                disabled={guardandoRol || rolEditar === modalEditar.role}
                className="flex-1 bg-[#E63946] hover:bg-[#c8303c] text-white py-3 rounded-xl font-['Oswald'] font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {guardandoRol ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel lateral perfil ─────────────────────────────────────────── */}
      {panelPerfil && (() => {
        const avatarColor = getAvatarColor(panelPerfil.fullName || panelPerfil.email)
        const avatarInicial = (panelPerfil.fullName || panelPerfil.email || '?')[0].toUpperCase()
        const fechaRegistro = panelPerfil.createdAt
          ? new Date(panelPerfil.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
          : null
        const fechaSuspension = panelPerfil.suspendedAt
          ? new Date(panelPerfil.suspendedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
          : null

        return (
          <>
            <button
              type="button"
              aria-label="Cerrar panel"
              className="fixed inset-0 bg-black/50 z-40 w-full cursor-default"
              onClick={() => setPanelPerfil(null)}
            />

            <aside className="fixed inset-y-0 right-0 w-80 bg-[#161616] border-l border-white/[0.06] z-50 flex flex-col overflow-hidden">

              {/* Cabecera */}
              <div className="flex items-center justify-between px-5 h-[65px] border-b border-white/[0.06] flex-shrink-0">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em]">Perfil de usuario</p>
                <button
                  type="button"
                  onClick={() => setPanelPerfil(null)}
                  className="text-white/30 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Avatar + identificación */}
              <div className="px-5 py-5 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${avatarColor}22`,
                      border: `2px solid ${avatarColor}55`,
                      color: avatarColor,
                    }}
                  >
                    {avatarInicial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate leading-tight">{panelPerfil.fullName}</p>
                    <p className="text-white/40 text-xs truncate mt-0.5">{panelPerfil.email}</p>
                    {panelPerfil.nickname && (
                      <p className="text-white/22 text-xs mt-0.5">@{panelPerfil.nickname}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <RolBadge rol={panelPerfil.role} />
                  <StatusBadge status={panelPerfil.status} />
                </div>
              </div>

              {/* Cuerpo scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] text-center">
                    <p className="font-['Oswald'] text-3xl font-bold text-white leading-none">{panelPerfil.rutinasCount ?? 0}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1.5">Rutinas</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] text-center">
                    <p className="font-['Oswald'] text-3xl font-bold text-white leading-none">{panelPerfil.sesionesCount ?? 0}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1.5">Sesiones</p>
                  </div>
                </div>

                {/* Info general */}
                <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] px-4">
                  <InfoRow label="Último acceso" value={formatUltimaVez(panelPerfil.lastSeenAt)} />
                  <InfoRow label="Registrado" value={fechaRegistro} />
                </div>

                {/* Suspensión */}
                {panelPerfil.suspended && (
                  <div className="bg-[#E63946]/[0.06] border border-[#E63946]/20 rounded-xl p-4">
                    <p className="text-[#E63946] text-[10px] font-bold uppercase tracking-widest mb-2">Cuenta suspendida</p>
                    {fechaSuspension && (
                      <p className="text-white/45 text-xs mb-1">Desde: {fechaSuspension}</p>
                    )}
                    {panelPerfil.suspendedReason
                      ? <p className="text-white/40 text-xs italic">"{panelPerfil.suspendedReason}"</p>
                      : <p className="text-white/22 text-xs">Sin motivo especificado</p>
                    }
                  </div>
                )}

                {/* Acciones rápidas */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-1">Acciones rápidas</p>
                  <button
                    type="button"
                    disabled={esAdminTarget(panelPerfil)}
                    title={esAdminTarget(panelPerfil) ? 'No disponible para administradores' : undefined}
                    onClick={() => { setPanelPerfil(null); setModalEditar(panelPerfil); setRolEditar(panelPerfil.role); setErrorEditar('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/55 hover:text-white hover:bg-white/[0.08] text-sm font-medium transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04] disabled:hover:text-white/55"
                  >
                    <IconEdit />
                    Cambiar rol
                  </button>
                  {panelPerfil.suspended ? (
                    <button
                      type="button"
                      disabled={esAdminTarget(panelPerfil)}
                      title={esAdminTarget(panelPerfil) ? 'No disponible para administradores' : undefined}
                      onClick={() => { setPanelPerfil(null); handleActivar(panelPerfil) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#00C9A7]/[0.08] border border-[#00C9A7]/20 text-[#00C9A7] hover:bg-[#00C9A7]/[0.14] text-sm font-medium transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#00C9A7]/[0.08]"
                    >
                      <IconPlay />
                      Reactivar cuenta
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={esAdminTarget(panelPerfil)}
                      title={esAdminTarget(panelPerfil) ? 'No disponible para administradores' : undefined}
                      onClick={() => { setPanelPerfil(null); setModalUsuario(panelPerfil) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-500/[0.08] border border-orange-500/20 text-orange-400 hover:bg-orange-500/[0.14] text-sm font-medium transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-orange-500/[0.08]"
                    >
                      <IconPause />
                      Suspender cuenta
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={esAdminTarget(panelPerfil)}
                    title={esAdminTarget(panelPerfil) ? 'No disponible para administradores' : undefined}
                    onClick={() => { setPanelPerfil(null); setModalEliminar(panelPerfil); setErrorEliminar('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#E63946]/[0.08] border border-[#E63946]/20 text-[#E63946] hover:bg-[#E63946]/[0.14] text-sm font-medium transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#E63946]/[0.08]"
                  >
                    <IconTrash />
                    Eliminar usuario
                  </button>
                </div>

              </div>
            </aside>
          </>
        )
      })()}

    </AdminLayout>
  )
}
