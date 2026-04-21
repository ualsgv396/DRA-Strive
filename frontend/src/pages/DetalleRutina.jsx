import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function DetalleRutina() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rutina, setRutina] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  useEffect(() => {
    const cargarRutina = async () => {
      try {
        const respuesta = await api.get(`/rutinas/${id}`)
        setRutina(respuesta.data)
      } catch (err) {
        setError('No se pudo cargar la rutina')
      } finally {
        setCargando(false)
      }
    }
    cargarRutina()
  }, [id])

  const eliminarRutina = async () => {
    setEliminando(true)
    try {
      await api.delete(`/rutinas/${id}`)
      navigate('/panel')
    } catch (err) {
      setError('Error al eliminar la rutina')
      setEliminando(false)
    }
  }

  const totalSeries = rutina?.ejercicios?.reduce((acc, e) => acc + e.series, 0) || 0
  const totalReps = rutina?.ejercicios?.reduce((acc, e) => acc + (e.series * e.repeticiones), 0) || 0

  if (cargando) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <p className="text-white/40 font-['Inter']">Cargando rutina...</p>
    </div>
  )

  if (error && !rutina) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
      <p className="text-[#E63946]">{error}</p>
      <button onClick={() => navigate('/panel')} className="text-white/50 hover:text-white transition-colors">
        ← Volver al panel
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111]">
        <span
          className="font-['Oswald'] text-2xl font-bold italic text-[#E63946] tracking-widest cursor-pointer"
          onClick={() => navigate('/panel')}
        >
          STRIVE
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/rutina/${id}/editar`)}
            className="border border-white/20 text-white/60 px-4 py-2 rounded-lg text-sm hover:text-white hover:border-white/40 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => setMostrarConfirmar(true)}
            className="border border-[#E63946]/40 text-[#E63946] px-4 py-2 rounded-lg text-sm hover:bg-[#E63946]/10 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">

        {/* Cabecera rutina */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/panel')}
            className="text-white/40 text-sm hover:text-white transition-colors mb-6 flex items-center gap-2"
          >
            ← Mis rutinas
          </button>
          <h1 className="font-['Oswald'] text-5xl md:text-6xl font-bold uppercase mb-4">
            {rutina?.nombre}
          </h1>
          {rutina?.descripcion && (
            <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
              {rutina.descripcion}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { valor: rutina?.ejercicios?.length || 0, etiqueta: 'Ejercicios' },
            { valor: totalSeries, etiqueta: 'Series totales' },
            { valor: totalReps, etiqueta: 'Reps totales' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-white/5">
              <p className="font-['Oswald'] text-4xl font-bold text-[#E63946] mb-1">{stat.valor}</p>
              <p className="text-white/40 text-sm">{stat.etiqueta}</p>
            </div>
          ))}
        </div>

        {/* Lista ejercicios */}
        <div className="mb-10">
          <h2 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
            Ejercicios
          </h2>
          <div className="flex flex-col gap-4">
            {rutina?.ejercicios?.map((ejercicio, index) => (
              <div
                key={ejercicio.id}
                className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-5 border-l-4 border-[#E63946]"
              >
                {/* Número */}
                <span className="font-['Oswald'] text-2xl font-bold text-[#E63946]/40 w-10 flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Imagen */}
                <div className="w-16 h-16 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ejercicio.imagenUrl
                    ? <img src={ejercicio.imagenUrl} alt={ejercicio.nombre} className="w-full h-full object-cover" />
                    : <span className="text-2xl">💪</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Oswald'] font-semibold uppercase text-lg leading-tight truncate">
                    {ejercicio.nombre}
                  </h3>
                  <p className="text-white/40 text-sm">{ejercicio.grupoMuscular}</p>
                </div>

                {/* Series x Reps */}
                <div className="flex gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="font-['Oswald'] text-2xl font-bold">{ejercicio.series}</p>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Series</p>
                  </div>
                  <div className="text-white/20 flex items-center text-xl">×</div>
                  <div className="text-center">
                    <p className="font-['Oswald'] text-2xl font-bold">{ejercicio.repeticiones}</p>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Reps</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/rutina/nueva')}
            className="flex-1 bg-[#E63946] text-white py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
          >
            + Nueva rutina
          </button>
          <button
            onClick={() => navigate('/ejercicios')}
            className="flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors"
          >
            Ver ejercicios
          </button>
        </div>

      </div>

      {/* MODAL CONFIRMAR ELIMINAR */}
      {mostrarConfirmar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-3">
              ¿Eliminar rutina?
            </h3>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Esta acción no se puede deshacer. Se eliminará la rutina
              <span className="text-white font-semibold"> {rutina?.nombre}</span> permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmar(false)}
                className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarRutina}
                disabled={eliminando}
                className="flex-1 bg-[#E63946] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors disabled:opacity-70"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}