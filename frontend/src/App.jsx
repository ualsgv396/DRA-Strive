import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ProveedorAuth, useAuth } from './context/ContextoAuth'
import BottomNav from './components/layout/BottomNav'

import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Panel from './pages/Panel'
import Ejercicios from './pages/Ejercicios'
import ConstructorRutina from './pages/ConstructorRutina'
import FlashTraining from './pages/FlashTraining'
import DetalleRutina from './pages/DetalleRutina'
import Amigos from './pages/Amigos'
import Perfil from './pages/Perfil'
import PanelAdmin from './pages/admin/PanelAdmin'
import GestorEjercicios from './pages/admin/GestorEjercicios'
import GestionUsuarios from './pages/admin/GestionUsuarios'
import RegistroEntreno from './pages/RegistroEntreno'
import HistorialEntrenos from './pages/HistorialEntrenos'
import Progreso from './pages/Progreso'
import Logros from './pages/Logros'

const RUTAS_SIN_NAV = new Set(['/', '/login', '/registro'])

function RutaProtegida({ children, soloAdmin = false }) {
  const { cargandoSesion, estaAutenticado, esAdmin } = useAuth()

  if (cargandoSesion) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0D0D0D'
      }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E63946', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!estaAutenticado()) return <Navigate to="/login" replace />
  if (soloAdmin && !esAdmin()) return <Navigate to="/panel" replace />

  return children
}

function RutasApp() {
  const { pathname } = useLocation()
  const mostrarNav = !RUTAS_SIN_NAV.has(pathname) && !pathname.startsWith('/admin') && !pathname.startsWith('/entrenamiento/')

  return (
    <>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/panel"    element={<RutaProtegida><Panel /></RutaProtegida>} />
        <Route path="/ejercicios" element={<RutaProtegida><Ejercicios /></RutaProtegida>} />
        <Route path="/rutina/nueva" element={<RutaProtegida><ConstructorRutina /></RutaProtegida>} />
        <Route path="/flash-training" element={<RutaProtegida><FlashTraining /></RutaProtegida>} />
        <Route path="/rutina/:id" element={<RutaProtegida><DetalleRutina /></RutaProtegida>} />
        <Route path="/amigos"  element={<RutaProtegida><Amigos /></RutaProtegida>} />
        <Route path="/perfil"  element={<RutaProtegida><Perfil /></RutaProtegida>} />
        <Route path="/historial" element={<RutaProtegida><HistorialEntrenos /></RutaProtegida>} />
        <Route path="/progreso"  element={<RutaProtegida><Progreso /></RutaProtegida>} />
        <Route path="/logros"    element={<RutaProtegida><Logros /></RutaProtegida>} />
        <Route path="/entrenamiento/:sessionId" element={<RutaProtegida><RegistroEntreno /></RutaProtegida>} />
        <Route path="/admin"           element={<RutaProtegida soloAdmin><PanelAdmin /></RutaProtegida>} />
        <Route path="/admin/ejercicios" element={<RutaProtegida soloAdmin><GestorEjercicios /></RutaProtegida>} />
        <Route path="/admin/usuarios"   element={<RutaProtegida soloAdmin><GestionUsuarios /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {mostrarNav && <BottomNav />}
    </>
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