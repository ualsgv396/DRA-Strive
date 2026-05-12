import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ContextoAuth'
import ShutDownLineIcon from 'remixicon-react/ShutDownLineIcon'

export default function BotonCerrarSesion({ size = 18, style: extraStyle }) {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const handleClick = () => {
    cerrarSesion()
    navigate('/')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Cerrar sesión"
      className="logout-btn"
      style={{ ...s.boton, ...extraStyle }}
    >
      <ShutDownLineIcon size={size} color="#fff" />
    </button>
  )
}

const s = {
  boton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#E63946',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
}
