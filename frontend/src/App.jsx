import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ProveedorAuth } from './context/ContextoAuth'
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
import RegistroEntreno from './pages/RegistroEntreno'
import HistorialEntrenos from './pages/HistorialEntrenos'

const RUTAS_SIN_NAV = new Set(['/', '/login', '/registro'])

function RutasApp() {
  const { pathname } = useLocation()
  const mostrarNav = !RUTAS_SIN_NAV.has(pathname) && !pathname.startsWith('/admin')

  return (
    <>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/ejercicios" element={<Ejercicios />} />
        <Route path="/rutina/nueva" element={<ConstructorRutina />} />
        <Route path="/flash-training" element={<FlashTraining />} />
        <Route path="/rutina/:id" element={<DetalleRutina />} />
        <Route path="/amigos" element={<Amigos />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/admin/ejercicios" element={<GestorEjercicios />} />
        <Route path="/entrenamiento/:sessionId" element={<RegistroEntreno />} />
        <Route path="/historial" element={<HistorialEntrenos />} />
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