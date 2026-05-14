import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ContextoAuth'

// ── Icons ──────────────────────────────────────────────────────────────────────

export const IconGrid = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

export const IconBars = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/>
    <rect x="16" y="5" width="4" height="16" rx="1"/>
  </svg>
)

export const IconUsers = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export const IconGear = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

export const IconLogout = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconMenu = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const IconBell = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

// ── Helpers ────────────────────────────────────────────────────────────────────

export const formatBadge = n => {
  if (n == null) return null
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

// ── Nav config ─────────────────────────────────────────────────────────────────

const NAV_GRUPOS = [
  {
    label: 'WORKSPACE',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: IconGrid, path: '/admin' }],
  },
  {
    label: 'CATÁLOGO',
    items: [{ id: 'ejercicios', label: 'Ejercicios', icon: IconBars, path: '/admin/ejercicios' }],
  },
  {
    label: 'PERSONAS',
    items: [{ id: 'usuarios', label: 'Usuarios', icon: IconUsers, path: '/admin/usuarios' }],
  },
  {
    label: 'SISTEMA',
    items: [{ id: 'ajustes', label: 'Ajustes', icon: IconGear, path: '/admin/ajustes' }],
  },
]

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ paginaActiva, cuentas, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()

  const inicial = (usuario?.nombre || usuario?.email || 'A')[0].toUpperCase()

  const badgePor = {
    ejercicios: formatBadge(cuentas?.ejercicios),
    usuarios:   formatBadge(cuentas?.usuarios),
  }

  const handleNav = path => {
    navigate(path)
    onClose?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black/60 z-30 lg:hidden w-full cursor-default"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-[#111111] border-r border-white/[0.06] z-40
          flex flex-col transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[65px] border-b border-white/[0.06] flex-shrink-0">
          <span className="font-['Oswald'] text-xl font-bold italic text-[#E63946] tracking-widest">STRIVE</span>
          <span className="bg-[#E63946]/15 text-[#E63946] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GRUPOS.map(({ label, items }) => (
            <div key={label} className="mb-5">
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{label}</p>
              {items.map(item => {
                const activo = item.id === paginaActiva
                const badge  = badgePor[item.id]
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`
                      w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5
                      ${activo ? 'bg-[#E63946]/15 text-[#E63946]' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'}
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon size={16} />
                      {item.label}
                    </span>
                    {badge && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${activo ? 'bg-[#E63946]/20 text-[#E63946]' : 'bg-white/[0.07] text-white/35'}`}>
                        {badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Perfil */}
        <div className="border-t border-white/[0.06] px-4 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#E63946] text-sm font-bold leading-none">{inicial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{usuario?.nombre || 'Admin'}</p>
              <p className="text-white/30 text-xs truncate leading-tight mt-0.5">{usuario?.email || ''}</p>
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── AdminLayout ────────────────────────────────────────────────────────────────

export default function AdminLayout({ children, paginaActiva = 'dashboard', breadcrumb = [], cuentas = {} }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div className="flex h-screen bg-[#0D0D0D] overflow-hidden text-white">

      <Sidebar
        paginaActiva={paginaActiva}
        cuentas={cuentas}
        mobileOpen={sidebarAbierto}
        onClose={() => setSidebarAbierto(false)}
      />

      <div className="flex-1 lg:ml-60 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 h-[65px] border-b border-white/[0.06] bg-[#111111] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarAbierto(true)}
              className="lg:hidden text-white/35 hover:text-white/70 transition-colors"
            >
              <IconMenu />
            </button>
            <nav className="text-sm flex items-center gap-2">
              {breadcrumb.map((seg, i) => (
                <span key={seg} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/20">›</span>}
                  <span className={i === breadcrumb.length - 1 ? 'text-white/80' : 'text-white/30'}>{seg}</span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-white/[0.05] rounded-lg px-3 py-2 text-white/25 text-xs w-52 border border-white/[0.04]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Buscar en todo el admin…
            </div>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all relative">
              <IconBell />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E63946] rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
          {children}
        </main>

      </div>
    </div>
  )
}
