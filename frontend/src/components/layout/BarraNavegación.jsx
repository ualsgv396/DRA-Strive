import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const enlaces = [
  { etiqueta: 'Inicio',      icono: '🏠', ruta: '/panel'       },
  { etiqueta: 'Crear',       icono: '➕', ruta: '/rutina/nueva' },
  { etiqueta: 'Perfil',      icono: '👤', ruta: '/perfil'       },
  { etiqueta: 'Amigos',      icono: '🤝', ruta: '/amigos'       },
  { etiqueta: 'Ejercicios',  icono: '🏋️', ruta: '/ejercicios'   },
]

export default function BarraNavegacion() {
  const navigate = useNavigate()
  const location = useLocation()
  // Estado de "presionado" para feedback táctil en lugar de :hover
  const [presionado, setPresionado] = useState(null)

  const esActiva = (ruta) =>
    ruta === '/panel'
      ? location.pathname === '/panel'
      : location.pathname.startsWith(ruta)

  return (
    <nav style={s.barra} role="navigation" aria-label="Navegación principal">
      {enlaces.map((enlace) => {
        const activa   = esActiva(enlace.ruta)
        const tocado   = presionado === enlace.ruta

        return (
          <button
            key={enlace.ruta}
            onClick={() => navigate(enlace.ruta)}
            onPointerDown={() => setPresionado(enlace.ruta)}
            onPointerUp={() => setPresionado(null)}
            onPointerLeave={() => setPresionado(null)}
            style={{
              ...s.boton,
              ...(activa ? s.botonActivo : {}),
              ...(tocado && !activa ? s.botonTocado : {}),
            }}
            aria-current={activa ? 'page' : undefined}
            aria-label={enlace.etiqueta}
          >
            <span style={s.icono} aria-hidden="true">{enlace.icono}</span>
            <span style={activa ? s.textoActivo : s.texto}>{enlace.etiqueta}</span>
          </button>
        )
      })}
    </nav>
  )
}

const s = {
  barra: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 'min(940px, 100vw)',
    backgroundColor: 'rgba(17,17,17,0.97)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    // Borde redondeado solo en escritorio (pill); en móvil va pegado al borde
    borderRadius: 'min(18px, env(safe-area-inset-bottom, 0px) * 0 + 18px)',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    padding: '8px 8px',
    // Espacio extra por el notch de iPhone / Android
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    gap: '4px',
    zIndex: 999,
    boxShadow: '0 -1px 0 rgba(255,255,255,0.05), 0 -8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  boton: {
    border: 'none',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    // Mínimo 44×44px: directriz de Apple HIG para targets táctiles
    minHeight: '52px',
    minWidth: '44px',
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    cursor: 'pointer',
    transition: 'background-color 0.12s, transform 0.1s',
    WebkitTapHighlightColor: 'transparent',
  },
  botonActivo: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(230,57,70,0.18)',
    boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.4)',
  },
  // Feedback visual para touch (reemplaza :hover que no aplica en táctil)
  botonTocado: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: 'scale(0.94)',
  },
  icono: {
    fontSize: '19px',
    lineHeight: 1,
    pointerEvents: 'none',
  },
  texto: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.1px',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  textoActivo: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1px',
    textAlign: 'center',
    color: '#E63946',
    pointerEvents: 'none',
  },
}
