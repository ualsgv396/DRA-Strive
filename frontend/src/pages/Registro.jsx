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
  const [mostrarPassword, setMostrarPassword] = useState(false)

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
    <div className="auth-page">

      {/* Hero compacto (mobile / tablet) */}
      <header className="auth-hero">
        <Link to="/" className="auth-logo" aria-label="Ir al inicio">STRIVE</Link>
        <span className="auth-hero-tag">Empieza hoy</span>
      </header>

      {/* Hero amplio (desktop ≥900px) */}
      <aside className="auth-split-hero" aria-hidden="true">
        <Link to="/" className="auth-logo">STRIVE</Link>
        <div>
          <h1 className="auth-hero-title">Empieza<br />hoy.</h1>
          <p className="auth-hero-subtitle">El primer paso es el más importante. Únete y construye la rutina que mereces.</p>
        </div>
        <div className="auth-hero-meta">
          <span>Gratis para empezar</span>
          <span>Sin tarjeta</span>
        </div>
      </aside>

      {/* Formulario */}
      <main className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-form-head">
            <h2>Crear cuenta</h2>
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="auth-link">Inicia sesión</Link>
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="reg-nombre">Nombre</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-nombre"
                  className="auth-input"
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={manejarCambio}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="reg-nickname">Nickname</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-nickname"
                    className="auth-input"
                    type="text"
                    name="nickname"
                    value={formulario.nickname}
                    onChange={manejarCambio}
                    placeholder="ej: pepefit"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email">Email</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-email"
                    className="auth-input"
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={manejarCambio}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="reg-password">Contraseña</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-password"
                    className="auth-input"
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password"
                    value={formulario.password}
                    onChange={manejarCambio}
                    placeholder="Mín. 6 caracteres"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setMostrarPassword((v) => !v)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword}
                  >
                    {mostrarPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirmarPassword">Confirmar</label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-confirmarPassword"
                    className="auth-input"
                    type={mostrarPassword ? 'text' : 'password'}
                    name="confirmarPassword"
                    value={formulario.confirmarPassword}
                    onChange={manejarCambio}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">{error}</div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Creando cuenta…
                </>
              ) : 'Crear cuenta gratis'}
            </button>

            <p className="auth-legal">
              Al registrarte aceptas nuestros{' '}
              <a>Términos de uso</a> y{' '}
              <a>Política de privacidad</a>.
            </p>
          </form>
        </div>
      </main>

    </div>
  )
}
