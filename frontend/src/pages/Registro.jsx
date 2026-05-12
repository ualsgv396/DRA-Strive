import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/ContextoAuth'
import api from '../api/axios'

export default function Registro() {
  const navigate = useNavigate()
  const { iniciarSesionDesdeRespuestaAuth } = useAuth()
  const [formulario, setFormulario] = useState({
    nombre: '',
    nickname: '',
    email: '',
    password: '',
    confirmarPassword: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setError('')

    if (formulario.password !== formulario.confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (formulario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)
    try {
      const respuesta = await api.post('/auth/register', {
        fullName: formulario.nombre,
        nickname: formulario.nickname,
        email: formulario.email,
        password: formulario.password
      })
      iniciarSesionDesdeRespuestaAuth(respuesta.data)
      navigate('/panel')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={estilos.contenedor}>

      {/* Panel izquierdo */}
      <div style={estilos.panelIzquierdo}>
        <Link to="/" style={estilos.logo}>STRIVE</Link>
        <div style={estilos.heroTexto}>
          <h1 style={estilos.heroTitulo}>EMPIEZA<br />HOY.</h1>
          <p style={estilos.heroSubtitulo}>El primer paso es el más importante.</p>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={estilos.panelDerecho}>
        <div style={estilos.formularioContenedor}>
          <h2 style={estilos.titulo}>Crear cuenta</h2>
          <p style={estilos.subtitulo}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={estilos.enlace}>Inicia sesión</Link>
          </p>

          <form onSubmit={manejarEnvio} style={estilos.form}>
            <div style={estilos.campoGrupo}>
              <label style={estilos.label}>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                placeholder="Tu nombre"
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.campoGrupo}>
              <label style={estilos.label}>Nickname</label>
              <input
                type="text"
                name="nickname"
                value={formulario.nickname}
                onChange={manejarCambio}
                placeholder="ej: pepefit"
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.campoGrupo}>
              <label style={estilos.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={manejarCambio}
                placeholder="tu@email.com"
                required
                style={estilos.input}
              />
            </div>

            <div style={estilos.filaDos}>
              <div style={estilos.campoGrupo}>
                <label style={estilos.label}>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formulario.password}
                  onChange={manejarCambio}
                  placeholder="••••••••"
                  required
                  style={estilos.input}
                />
              </div>
              <div style={estilos.campoGrupo}>
                <label style={estilos.label}>Confirmar</label>
                <input
                  type="password"
                  name="confirmarPassword"
                  value={formulario.confirmarPassword}
                  onChange={manejarCambio}
                  placeholder="••••••••"
                  required
                  style={estilos.input}
                />
              </div>
            </div>

            {error && (
              <div style={estilos.error}>{error}</div>
            )}

            <button
              type="submit"
              disabled={cargando}
              style={{ ...estilos.boton, opacity: cargando ? 0.7 : 1 }}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>

            <p style={estilos.legal}>
              Al registrarte aceptas nuestros{' '}
              <span style={estilos.enlace}>Términos de uso</span> y{' '}
              <span style={estilos.enlace}>Política de privacidad</span>
            </p>
          </form>
        </div>
      </div>

    </div>
  )
}

const estilos = {
  contenedor: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0D0D0D'
  },
  panelIzquierdo: {
    flex: 1,
    backgroundColor: '#E63946',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: '2px',
    textDecoration: 'none'
  },
  heroTexto: {
    marginBottom: '60px'
  },
  heroTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '64px',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: '1.05',
    textTransform: 'uppercase',
    marginBottom: '16px'
  },
  heroSubtitulo: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'Inter', sans-serif"
  },
  panelDerecho: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  formularioContenedor: {
    width: '100%',
    maxWidth: '440px'
  },
  titulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '36px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  subtitulo: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '40px',
    fontFamily: "'Inter', sans-serif"
  },
  enlace: {
    color: '#E63946',
    textDecoration: 'none',
    fontWeight: '600',
    cursor: 'pointer'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  filaDos: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  campoGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif"
  },
  input: {
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '14px 16px',
    fontSize: '15px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    width: '100%'
  },
  error: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    border: '1px solid rgba(230, 57, 70, 0.4)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#E63946',
    fontFamily: "'Inter', sans-serif"
  },
  boton: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '8px'
  },
  legal: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.6'
  }
}