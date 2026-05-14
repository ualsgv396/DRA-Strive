import { useLocation, useNavigate } from 'react-router-dom'
import HomeFillIcon    from 'remixicon-react/HomeFillIcon'
import HeartAddLineIcon from 'remixicon-react/HeartAddLineIcon'
import UserLineIcon    from 'remixicon-react/UserLineIcon'
import TeamLineIcon    from 'remixicon-react/TeamLineIcon'
import BookletLineIcon  from 'remixicon-react/BookletLineIcon'

const NAV_ITEMS = [
  { label: 'INICIO',     Icon: HomeFillIcon,    ruta: '/panel'        },
  { label: 'CREAR',      Icon: HeartAddLineIcon, ruta: '/rutina/nueva' },
  { label: 'PERFIL',     Icon: UserLineIcon,     ruta: '/perfil'       },
  { label: 'AMIGOS',     Icon: TeamLineIcon,     ruta: '/amigos'       },
  { label: 'EJERCICIOS', Icon: BookletLineIcon,  ruta: '/ejercicios'   },
]

const GRAY_INACTIVE = 'rgba(255,255,255,0.55)'
const RED           = '#FF6B7A'

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
                 border-t border-white/[0.06]"
      style={{
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(15,15,15,0.86)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 -10px 36px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset',
      }}
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
              'min-h-[54px] min-w-[48px] flex-1 max-w-[88px]',
              'rounded-xl px-1 py-2',
              'cursor-pointer select-none',
              'transition-all duration-150',
              activa ? '' : 'hover:bg-white/[0.04] active:scale-95',
            ].join(' ')}
            style={
              activa
                ? {
                    background: 'rgba(230,57,70,0.10)',
                    boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.40), 0 0 22px rgba(230,57,70,0.18)',
                  }
                : undefined
            }
          >
            <Icon size={22} color={activa ? RED : GRAY_INACTIVE} />
            <span
              className="font-['Inter'] text-[9px] font-semibold tracking-wider uppercase leading-none"
              style={{ color: activa ? RED : GRAY_INACTIVE, letterSpacing: '1.2px' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
