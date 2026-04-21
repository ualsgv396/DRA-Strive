import { createContext, useState, useEffect, useContext } from 'react'

const ContextoAuth = createContext(null)

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('strive_token')
    const datosUsuario = localStorage.getItem('strive_usuario')
    try {
      if (token && datosUsuario) {
        setUsuario(JSON.parse(datosUsuario))
      }
    } catch {
      localStorage.removeItem('strive_token')
      localStorage.removeItem('strive_usuario')
      setUsuario(null)
    } finally {
      setCargandoSesion(false)
    }
  }, [])

  const iniciarSesion = (token, datosUsuario) => {
    localStorage.setItem('strive_token', token)
    localStorage.setItem('strive_usuario', JSON.stringify(datosUsuario))
    setUsuario(datosUsuario)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('strive_token')
    localStorage.removeItem('strive_usuario')
    setUsuario(null)
  }

  const construirUsuarioDesdeAuth = (respuestaAuth) => ({
    id: respuestaAuth.userId,
    nombre: respuestaAuth.fullName,
    email: respuestaAuth.email,
    rol: respuestaAuth.role
  })

  const iniciarSesionDesdeRespuestaAuth = (respuestaAuth) => {
    const usuarioNormalizado = construirUsuarioDesdeAuth(respuestaAuth)
    iniciarSesion(respuestaAuth.token, usuarioNormalizado)
  }

  const esAdmin = () => usuario?.rol === 'ADMIN'
  const estaAutenticado = () => usuario !== null

  return (
    <ContextoAuth.Provider value={{
      usuario,
      cargandoSesion,
      iniciarSesion,
      iniciarSesionDesdeRespuestaAuth,
      cerrarSesion,
      esAdmin,
      estaAutenticado
    }}>
      {children}
    </ContextoAuth.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth')
  return contexto
}