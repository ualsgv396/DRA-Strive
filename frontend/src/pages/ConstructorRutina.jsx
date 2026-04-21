import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/ContextoAuth'
import api from '../api/axios'

const GRUPOS_MUSCULARES = ['Todos', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Abdomen', 'Glúteos', 'Cardio']

export default function ConstructorRutina() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [ejercicios, setEjercicios] = useState([])
  const [ejerciciosRutina, setEjerciciosRutina] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Todos')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        const respuesta = await api.get('/ejercicios')
        setEjercicios(respuesta.data)
      } catch (err) {
        console.error('Error cargando ejercicios:', err)
      }
    }
    cargarEjercicios()
  }, [])

  const ejerciciosFiltrados = ejercicios.filter((e) => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideGrupo = grupoSeleccionado === 'Todos' || e.grupoMuscular === grupoSeleccionado
    return coincideBusqueda && coincideGrupo
  })

  const agregarEjercicio = (ejercicio) => {
    const yaExiste = ejerciciosRutina.find(e => e.ejercicioId === ejercicio.id)
    if (yaExiste) return
    setEjerciciosRutina([...ejerciciosRutina, {
      ejercicioId: ejercicio.id,
      nombre: ejercicio.nombre,
      imagenUrl: ejercicio.imagenUrl,
      grupoMuscular: ejercicio.grupoMuscular,
      series: 3,
      repeticiones: 10,
      posicion: ejerciciosRutina.length + 1
    }])
  }

  const eliminarEjercicio = (ejercicioId) => {
    setEjerciciosRutina(ejerciciosRutina.filter(e => e.ejercicioId !== ejercicioId))
  }

  const actualizarEjercicio = (ejercicioId, campo, valor) => {
    setEjerciciosRutina(ejerciciosRutina.map(e =>
      e.ejercicioId === ejercicioId ? { ...e, [campo]: Number(valor) } : e
    ))
  }

  const guardarRutina = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (ejerciciosRutina.length === 0) { setError('Añade al menos un ejercicio'); return }

    setGuardando(true)
    setError('')
    try {
      await api.post('/rutinas', {
        nombre,
        descripcion,
        ejercicios: ejerciciosRutina.map(e => ({
          ejercicioId: e.ejercicioId,
          series: e.series,
          repeticiones: e.repeticiones,
          posicion: e.posicion
        }))
      })
      navigate('/panel')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la rutina')
    } finally {
      setGuardando(false)
    }
  }

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
        <span className="text-white/50 text-sm hidden md:block">
          Nueva rutina — Paso {paso} de 2
        </span>
        <button
          className="text-white/50 border border-white/20 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors"
          onClick={() => navigate('/panel')}
        >
          Cancelar
        </button>
      </nav>

      {/* INDICADOR DE PASOS */}
      <div className="flex items-center justify-center gap-4 py-6 border-b border-white/8">
        <div className={`flex items-center gap-2 text-sm font-semibold ${paso === 1 ? 'text-[#E63946]' : 'text-white/40'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${paso === 1 ? 'bg-[#E63946] text-white' : 'bg-white/10 text-white/40'}`}>1</span>
          <span className="hidden md:block">Información</span>
        </div>
        <div className="w-16 h-px bg-white/20"></div>
        <div className={`flex items-center gap-2 text-sm font-semibold ${paso === 2 ? 'text-[#E63946]' : 'text-white/40'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${paso === 2 ? 'bg-[#E63946] text-white' : 'bg-white/10 text-white/40'}`}>2</span>
          <span className="hidden md:block">Ejercicios</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* PASO 1 — Información */}
        {paso === 1 && (
          <div className="max-w-lg mx-auto">
            <h1 className="font-['Oswald'] text-4xl font-bold uppercase mb-2">
              Crear rutina
            </h1>
            <p className="text-white/50 mb-10">Dale un nombre y descripción a tu rutina</p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Nombre de la rutina *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Fuerza Upper Body"
                  className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#E63946] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el objetivo de esta rutina..."
                  rows={4}
                  className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-[#E63946] transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => { if (!nombre.trim()) { setError('El nombre es obligatorio'); return } setError(''); setPaso(2) }}
                className="bg-[#E63946] text-white py-4 rounded-lg font-['Oswald'] font-bold text-base uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
              >
                Siguiente — Añadir ejercicios
              </button>
            </div>
          </div>
        )}

        {/* PASO 2 — Ejercicios */}
        {paso === 2 && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Panel izquierdo — Catálogo */}
            <div className="flex-1">
              <h2 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
                Catálogo de ejercicios
              </h2>

              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white mb-4 outline-none focus:border-[#E63946] transition-colors"
              />

              <div className="flex gap-2 flex-wrap mb-6">
                {GRUPOS_MUSCULARES.map((grupo) => (
                  <button
                    key={grupo}
                    onClick={() => setGrupoSeleccionado(grupo)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                      grupoSeleccionado === grupo
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#1A1A1A] text-white/50 border border-white/10 hover:text-white'
                    }`}
                  >
                    {grupo}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
                {ejerciciosFiltrados.map((ejercicio) => {
                  const yaAgregado = ejerciciosRutina.find(e => e.ejercicioId === ejercicio.id)
                  return (
                    <div
                      key={ejercicio.id}
                      className={`flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border transition-all ${
                        yaAgregado ? 'border-[#E63946]/40 opacity-60' : 'border-white/5 hover:border-white/20 cursor-pointer'
                      }`}
                      onClick={() => !yaAgregado && agregarEjercicio(ejercicio)}
                    >
                      <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {ejercicio.imagenUrl
                          ? <img src={ejercicio.imagenUrl} alt={ejercicio.nombre} className="w-full h-full object-cover" />
                          : <span className="text-2xl">💪</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Oswald'] font-semibold uppercase truncate">{ejercicio.nombre}</p>
                        <p className="text-white/40 text-xs">{ejercicio.grupoMuscular}</p>
                      </div>
                      <span className={`text-xl flex-shrink-0 ${yaAgregado ? 'text-[#E63946]' : 'text-white/20'}`}>
                        {yaAgregado ? '✓' : '+'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel derecho — Rutina */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-[#111] rounded-2xl p-6 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-['Oswald'] text-xl font-bold uppercase">{nombre}</h2>
                  <span className="bg-[#E63946]/15 text-[#E63946] text-xs font-bold px-3 py-1 rounded-full">
                    {ejerciciosRutina.length} ejercicios
                  </span>
                </div>

                {ejerciciosRutina.length === 0 && (
                  <div className="text-center py-10 text-white/30">
                    <p className="text-3xl mb-3">📋</p>
                    <p className="text-sm">Añade ejercicios desde el catálogo</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                  {ejerciciosRutina.map((ejercicio, index) => (
                    <div key={ejercicio.ejercicioId} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[#E63946] font-bold text-sm font-['Oswald']">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <p className="font-['Oswald'] font-semibold uppercase text-sm leading-tight">
                            {ejercicio.nombre}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarEjercicio(ejercicio.ejercicioId)}
                          className="text-white/20 hover:text-[#E63946] transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Series</label>
                          <input
                            type="number"
                            min="1" max="20"
                            value={ejercicio.series}
                            onChange={(e) => actualizarEjercicio(ejercicio.ejercicioId, 'series', e.target.value)}
                            className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[#E63946]"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Reps</label>
                          <input
                            type="number"
                            min="1" max="100"
                            value={ejercicio.repeticiones}
                            onChange={(e) => actualizarEjercicio(ejercicio.ejercicioId, 'repeticiones', e.target.value)}
                            className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[#E63946]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm mt-4">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={guardarRutina}
                    disabled={guardando}
                    className={`bg-[#E63946] text-white py-4 rounded-lg font-['Oswald'] font-bold text-base uppercase tracking-wider transition-colors ${guardando ? 'opacity-70' : 'hover:bg-[#C1121F]'}`}
                  >
                    {guardando ? 'Guardando...' : 'Guardar rutina'}
                  </button>
                  <button
                    onClick={() => setPaso(1)}
                    className="text-white/40 text-sm hover:text-white transition-colors py-2"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}