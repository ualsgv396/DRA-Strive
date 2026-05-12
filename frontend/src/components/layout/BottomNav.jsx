import { useLocation, useNavigate } from 'react-router-dom'
import HomeFillIcon    from 'remixicon-react/HomeFillIcon'
import HeartAddLineIcon from 'remixicon-react/HeartAddLineIcon'
import UserLineIcon    from 'remixicon-react/UserLineIcon'
import TeamLineIcon    from 'remixicon-react/TeamLineIcon'
import BookletLineIcon  from 'remixicon-react/BookletLineIcon'
import BotonCerrarSesion from './BotonCerrarSesion'

const NAV_ITEMS = [
  { label: 'INICIO',     Icon: HomeFillIcon,    ruta: '/panel'        },
  { label: 'CREAR',      Icon: HeartAddLineIcon, ruta: '/rutina/nueva' },
  { label: 'PERFIL',     Icon: UserLineIcon,     ruta: '/perfil'       },
  { label: 'AMIGOS',     Icon: TeamLineIcon,     ruta: '/amigos'       },
  { label: 'EJERCICIOS', Icon: BookletLineIcon,  ruta: '/ejercicios'   },
]

const GRAY   = '#9CA3AF'
const RED    = '#FF414D'

export default function BottomNav() {
  const location = useLocation()
  const navigate  = useNavigate()

  const esActiva = (ruta) =>
    ruta === '/panel'
      ? location.pathname === '/panel'
      : location.pathname.startsWith(ruta)

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50
                 w-full max-w-[940px]
                 flex items-center justify-around
                 px-2 pt-2
                 bg-[#121212] border-t border-white/[0.07]
                 shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
    >
      {NAV_ITEMS.map(({ label, Icon, ruta }) => {
        const activa = esActiva(ruta)

        return (
          <button
            key={ruta}
            onClick={() => navigate(ruta)}
            aria-current={activa ? 'page' : undefined}
            aria-label={label}
            className={[
              'flex flex-col items-center justify-center gap-1',
              'min-h-[52px] min-w-[44px] flex-1 max-w-[88px]',
              'rounded-xl px-1 py-2',
              'cursor-pointer select-none',
              'transition-all duration-150',
              '-webkit-tap-highlight-color-transparent',
              activa
                ? 'bg-[rgba(255,65,77,0.12)] shadow-[inset_0_0_0_1px_rgba(255,65,77,0.35)]'
                : 'hover:bg-white/5 active:scale-95',
            ].join(' ')}
          >
            <Icon size={24} color={activa ? RED : GRAY} />
            <span
              className="font-['Inter'] text-[9px] font-semibold tracking-wide uppercase leading-none"
              style={{ color: activa ? RED : GRAY }}
            >
              {label}
            </span>
          </button>
        )
      })}

      {/* Botón cerrar sesión */}
      <div className="flex flex-col items-center justify-center gap-1 min-h-[52px] flex-1 max-w-[72px] px-1 py-2">
        <BotonCerrarSesion size={17} />
        <span
          className="font-['Inter'] text-[9px] font-semibold tracking-wide uppercase leading-none"
          style={{ color: '#E63946' }}
        >
          SALIR
        </span>
      </div>
    </nav>
  )
}
