import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth } from './context/ContextoAuth'
import { useAuth } from './context/ContextoAuth'

import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Panel from './pages/Panel'
import Ejercicios from './pages/Ejercicios'
import ConstructorRutina from './pages/ConstructorRutina'
import DetalleRutina from './pages/DetalleRutina'
import PanelAdmin from './pages/admin/PanelAdmin'
import GestorEjercicios from './pages/admin/GestorEjercicios'

function RutaProtegida({ children }) {
  const { estaAutenticado, cargandoSesion } = useAuth()
  if (cargandoSesion) return <PantallaCarga />
  return estaAutenticado() ? children : <Navigate to="/login" replace />
}

function RutaAdmin({ children }) {
  const { estaAutenticado, esAdmin, cargandoSesion } = useAuth()
  if (cargandoSesion) return <PantallaCarga />
  if (!estaAutenticado()) return <Navigate to="/login" replace />
  if (!esAdmin()) return <Navigate to="/panel" replace />
  return children
}

function RutaInvitado({ children }) {
  const { estaAutenticado, esAdmin, cargandoSesion } = useAuth()
  if (cargandoSesion) return <PantallaCarga />
  if (!estaAutenticado()) return children
  return <Navigate to={esAdmin() ? '/admin' : '/panel'} replace />
}

function PantallaCarga() {
  return (
    <div style={estilosCarga.contenedor}>
      <div style={estilosCarga.spinner} />
      <p style={estilosCarga.texto}>Cargando sesión...</p>
    </div>
  )
}

function RutasApp() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<RutaInvitado><Login /></RutaInvitado>} />
      <Route path="/registro" element={<RutaInvitado><Registro /></RutaInvitado>} />
      <Route path="/panel" element={<RutaProtegida><Panel /></RutaProtegida>} />
      <Route path="/ejercicios" element={<RutaProtegida><Ejercicios /></RutaProtegida>} />
      <Route path="/rutina/nueva" element={<RutaProtegida><ConstructorRutina /></RutaProtegida>} />
      <Route path="/rutina/:id" element={<RutaProtegida><DetalleRutina /></RutaProtegida>} />
      <Route path="/admin" element={<RutaAdmin><PanelAdmin /></RutaAdmin>} />
      <Route path="/admin/ejercicios" element={<RutaAdmin><GestorEjercicios /></RutaAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <RutasApp />
      </ProveedorAuth>
    </BrowserRouter>
  )
}

const estilosCarga = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTopColor: '#E63946',
    animation: 'spin 0.8s linear infinite'
  },
  texto: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)'
  }
}