import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const GRUPOS_MUSCULARES = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Abdomen', 'Glúteos', 'Cardio']
const DIFICULTADES = ['Principiante', 'Intermedio', 'Avanzado']

const formularioVacio = {
  nombre: '',
  descripcion: '',
  imagenUrl: '',
  grupoMuscular: 'Pecho',
  dificultad: 'Principiante'
}

export default function GestorEjercicios() {
  const navigate = useNavigate()
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    cargarEjercicios()
  }, [])

  const cargarEjercicios = async () => {
    try {
      const respuesta = await api.get('/ejercicios')
      setEjercicios(respuesta.data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  const abrirCrear = () => {
    setFormulario(formularioVacio)
    setEditandoId(null)
    setError('')
    setMostrarModal(true)
  }

  const abrirEditar = (ejercicio) => {
    setFormulario({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion || '',
      imagenUrl: ejercicio.imagenUrl || '',
      grupoMuscular: ejercicio.grupoMuscular,
      dificultad: ejercicio.dificultad
    })
    setEditandoId(ejercicio.id)
    setError('')
    setMostrarModal(true)
  }

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const guardarEjercicio = async () => {
    if (!formulario.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      if (editandoId) {
        await api.put(`/ejercicios/${editandoId}`, formulario)
      } else {
        await api.post('/ejercicios', formulario)
      }
      await cargarEjercicios()
      setMostrarModal(false)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarEjercicio = async (id) => {
    try {
      await api.delete(`/ejercicios/${id}`)
      setEjercicios(ejercicios.filter(e => e.id !== id))
      setConfirmarEliminar(null)
    } catch (err) {
      console.error('Error eliminando:', err)
    }
  }

  const ejerciciosFiltrados = ejercicios.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const coloresDificultad = {
    'Principiante': 'bg-green-500/15 text-green-400',
    'Intermedio': 'bg-yellow-500/15 text-yellow-400',
    'Avanzado': 'bg-[#E63946]/15 text-[#E63946]'
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111]">
        <div className="flex items-center gap-4">
          <span
            className="font-['Oswald'] text-2xl font-bold italic text-[#E63946] tracking-widest cursor-pointer"
            onClick={() => navigate('/admin')}
          >
            STRIVE
          </span>
          <span className="bg-[#E63946]/15 text-[#E63946] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Admin
          </span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="text-white/40 text-sm hover:text-white transition-colors"
        >
          ← Panel admin
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="font-['Oswald'] text-4xl font-bold uppercase mb-1">
              Gestionar ejercicios
            </h1>
            <p className="text-white/40 text-sm">{ejercicios.length} ejercicios en el catálogo</p>
          </div>
          <button
            onClick={abrirCrear}
            className="bg-[#E63946] text-white px-6 py-3 rounded-lg font-['Oswald'] font-bold uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
          >
            + Nuevo ejercicio
          </button>
        </div>

        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white mb-6 outline-none focus:border-[#E63946] transition-colors"
        />

        {/* Tabla */}
        {cargando ? (
          <div className="text-center py-20 text-white/30">Cargando ejercicios...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {ejerciciosFiltrados.map((ejercicio) => (
              <div
                key={ejercicio.id}
                className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Imagen */}
                <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ejercicio.imagenUrl
                    ? <img src={ejercicio.imagenUrl} alt={ejercicio.nombre} className="w-full h-full object-cover" />
                    : <span className="text-2xl">💪</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-['Oswald'] font-semibold uppercase truncate">{ejercicio.nombre}</p>
                  <p className="text-white/40 text-xs">{ejercicio.grupoMuscular}</p>
                </div>

                {/* Badge dificultad */}
                <span className={`text-xs font-bold px-3 py-1 rounded-full hidden sm:block ${coloresDificultad[ejercicio.dificultad]}`}>
                  {ejercicio.dificultad}
                </span>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => abrirEditar(ejercicio)}
                    className="border border-white/20 text-white/60 px-3 py-2 rounded-lg text-sm hover:text-white hover:border-white/40 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmarEliminar(ejercicio)}
                    className="border border-[#E63946]/30 text-[#E63946]/70 px-3 py-2 rounded-lg text-sm hover:bg-[#E63946]/10 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {ejerciciosFiltrados.length === 0 && (
              <div className="text-center py-20 text-white/30">
                <p className="text-4xl mb-4">🔍</p>
                <p>No se encontraron ejercicios</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
              {editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </h3>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nombre *</label>
                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={manejarCambio}
                  placeholder="Nombre del ejercicio"
                  className="bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={manejarCambio}
                  placeholder="Descripción del ejercicio..."
                  rows={3}
                  className="bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">URL de imagen</label>
                <input
                  name="imagenUrl"
                  value={formulario.imagenUrl}
                  onChange={manejarCambio}
                  placeholder="https://..."
                  className="bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Grupo muscular</label>
                  <select
                    name="grupoMuscular"
                    value={formulario.grupoMuscular}
                    onChange={manejarCambio}
                    className="bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors"
                  >
                    {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Dificultad</label>
                  <select
                    name="dificultad"
                    value={formulario.dificultad}
                    onChange={manejarCambio}
                    className="bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors"
                  >
                    {DIFICULTADES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEjercicio}
                  disabled={guardando}
                  className="flex-1 bg-[#E63946] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#C1121F] transition-colors disabled:opacity-70"
                >
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear ejercicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-3">¿Eliminar ejercicio?</h3>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Se eliminará <span className="text-white font-semibold">{confirmarEliminar.nombre}</span> del catálogo permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarEjercicio(confirmarEliminar.id)}
                className="flex-1 bg-[#E63946] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}