import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/ContextoAuth'
import api from '../api/axios'

export default function Login() {
  const navigate = useNavigate()
  const { iniciarSesionDesdeRespuestaAuth } = useAuth()
  const [formulario, setFormulario] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const respuesta = await api.post('/auth/login', formulario)
      iniciarSesionDesdeRespuestaAuth(respuesta.data)
      navigate(respuesta.data.role === 'ADMIN' ? '/admin' : '/panel')
    } catch (err) {
      setError(err.response?.data?.message || 'Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-page">

      {/* Hero compacto (mobile / tablet) */}
      <header className="auth-hero">
        <Link to="/" className="auth-logo" aria-label="Ir al inicio">STRIVE</Link>
        <span className="auth-hero-tag">Tu rutina te espera</span>
      </header>

      {/* Hero amplio (desktop ≥900px) */}
      <aside className="auth-split-hero" aria-hidden="true">
        <Link to="/" className="auth-logo">STRIVE</Link>
        <div>
          <h1 className="auth-hero-title">Bienvenido<br />de vuelta.</h1>
          <p className="auth-hero-subtitle">Tu rutina te está esperando. Cada sesión cuenta.</p>
        </div>
        <div className="auth-hero-meta">
          <span>Entrenos guardados</span>
          <span>Progreso real</span>
        </div>
      </aside>

      {/* Formulario */}
      <main className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-form-head">
            <h2>Iniciar sesión</h2>
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="auth-link">Regístrate gratis</Link>
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <input
                  id="login-email"
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

            <div className="auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  className="auth-input"
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  value={formulario.password}
                  onChange={manejarCambio}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <div className="auth-helper-row">
              <Link to="/recuperar" className="auth-link">¿Olvidaste tu contraseña?</Link>
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
                  Entrando…
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </main>

    </div>
  )
}
