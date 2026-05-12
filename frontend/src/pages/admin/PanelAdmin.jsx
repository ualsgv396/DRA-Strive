import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/ContextoAuth'
import api from '../../api/axios'
import BotonCerrarSesion from '../../components/layout/BotonCerrarSesion'

export default function PanelAdmin() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalEjercicios: 0,
    totalRutinas: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const respuesta = await api.get('/admin/stats')
        setStats(respuesta.data)
      } catch (err) {
        console.error('Error cargando stats:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarStats()
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111]">
        <div className="flex items-center gap-4">
          <span className="font-['Oswald'] text-2xl font-bold italic text-[#E63946] tracking-widest">
            STRIVE
          </span>
          <span className="bg-[#E63946]/15 text-[#E63946] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden md:block">{usuario?.nombre}</span>
          <BotonCerrarSesion />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* Cabecera */}
        <div className="mb-10">
          <h1 className="font-['Oswald'] text-5xl font-bold uppercase mb-2">
            Panel de administración
          </h1>
          <p className="text-white/40">Gestiona los recursos de la aplicación</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { valor: stats.totalUsuarios, etiqueta: 'Usuarios registrados', icono: '👤' },
            { valor: stats.totalEjercicios, etiqueta: 'Ejercicios en catálogo', icono: '🏋️' },
            { valor: stats.totalRutinas, etiqueta: 'Rutinas creadas', icono: '📋' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5">
              <span className="text-4xl block mb-4">{stat.icono}</span>
              <p className="font-['Oswald'] text-5xl font-bold text-[#E63946] mb-2">
                {cargando ? '—' : stat.valor}
              </p>
              <p className="text-white/40 text-sm">{stat.etiqueta}</p>
            </div>
          ))}
        </div>

        {/* Acciones rápidas */}
        <h2 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
          Gestión
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div
            onClick={() => navigate('/admin/ejercicios')}
            className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5 hover:border-[#E63946]/40 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-5xl">🏋️</span>
              <span className="text-white/20 group-hover:text-[#E63946] transition-colors text-2xl">→</span>
            </div>
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-2">
              Gestionar ejercicios
            </h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Añade, edita o elimina ejercicios del catálogo. Sube imágenes y asigna grupos musculares.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/usuarios')}
            className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5 hover:border-[#E63946]/40 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-5xl">👥</span>
              <span className="text-white/20 group-hover:text-[#E63946] transition-colors text-2xl">→</span>
            </div>
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-2">
              Gestionar usuarios
            </h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Consulta los usuarios registrados y gestiona sus roles y permisos.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}