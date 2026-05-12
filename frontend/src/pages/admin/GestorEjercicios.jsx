import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import BotonCerrarSesion from '../../components/layout/BotonCerrarSesion'

// Valores del enum ExerciseType del backend
const TIPOS = [
  { value: 'FUERZA',    label: 'Fuerza' },
  { value: 'CARDIO',    label: 'Cardio' },
  { value: 'MOVILIDAD', label: 'Movilidad' },
]

// Valores del enum Difficulty del backend
const DIFICULTADES = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio' },
  { value: 'AVANZADO',     label: 'Avanzado' },
]

const formularioVacio = {
  title:            '',
  description:      '',
  imageUrl:         '',
  type:             'FUERZA',
  muscleGroupsText: '', // texto libre separado por comas → se convierte en array al guardar
  difficulty:       'PRINCIPIANTE',
}

export default function GestorEjercicios() {
  const navigate = useNavigate()
  const [ejercicios, setEjercicios]         = useState([])
  const [cargando, setCargando]             = useState(true)
  const [mostrarModal, setMostrarModal]     = useState(false)
  const [formulario, setFormulario]         = useState(formularioVacio)
  const [editandoId, setEditandoId]         = useState(null)
  const [guardando, setGuardando]           = useState(false)
  const [error, setError]                   = useState('')
  const [busqueda, setBusqueda]             = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => { cargarEjercicios() }, [])

  const cargarEjercicios = async () => {
    try {
      const { data } = await api.get('/exercises')
      setEjercicios(data)
    } catch (err) {
      console.error('Error cargando ejercicios:', err)
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

  const abrirEditar = (ej) => {
    setFormulario({
      title:            ej.title,
      description:      ej.description || '',
      imageUrl:         ej.imageUrl || '',
      type:             ej.type || 'FUERZA',
      muscleGroupsText: ej.muscleGroups?.join(', ') || '',
      difficulty:       ej.difficulty || 'PRINCIPIANTE',
    })
    setEditandoId(ej.id)
    setError('')
    setMostrarModal(true)
  }

  const manejarCambio = (e) =>
    setFormulario(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // Construye el body que espera CreateExerciseRequest del backend
  const construirPayload = () => ({
    title:        formulario.title.trim(),
    imageUrl:     formulario.imageUrl.trim() || null,
    type:         formulario.type,
    description:  formulario.description.trim() || null,
    muscleGroups: formulario.muscleGroupsText
      .split(',')
      .map(g => g.trim())
      .filter(Boolean),
    difficulty:   formulario.difficulty || null,
  })

  const guardarEjercicio = async () => {
    if (!formulario.title.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      const payload = construirPayload()
      if (editandoId) {
        await api.put(`/exercises/${editandoId}`, payload)
      } else {
        await api.post('/exercises', payload)
      }
      await cargarEjercicios()
      setMostrarModal(false)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.mensaje || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarEjercicio = async (id) => {
    try {
      await api.delete(`/exercises/${id}`)
      setEjercicios(prev => prev.filter(e => e.id !== id))
      setConfirmarEliminar(null)
    } catch (err) {
      console.error('Error eliminando ejercicio:', err)
    }
  }

  // Filtra por título O por grupos musculares
  const ejerciciosFiltrados = ejercicios.filter(e => {
    const q = busqueda.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.muscleGroups?.some(g => g.toLowerCase().includes(q))
    )
  })

  const colorDificultad = {
    PRINCIPIANTE: 'bg-green-500/15 text-green-400',
    INTERMEDIO:   'bg-yellow-500/15 text-yellow-400',
    AVANZADO:     'bg-[#E63946]/15 text-[#E63946]',
  }

  const colorTipo = {
    FUERZA:    'bg-blue-500/15 text-blue-400',
    CARDIO:    'bg-orange-500/15 text-orange-400',
    MOVILIDAD: 'bg-teal-500/15 text-teal-400',
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="text-white/40 text-sm hover:text-white transition-colors"
          >
            ← Panel admin
          </button>
          <BotonCerrarSesion />
        </div>
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
          placeholder="Buscar por nombre o grupo muscular..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white mb-6 outline-none focus:border-[#E63946] transition-colors"
        />

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-20 text-white/30">Cargando ejercicios...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {ejerciciosFiltrados.map((ej) => (
              <div
                key={ej.id}
                className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Imagen */}
                <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ej.imageUrl
                    ? <img src={ej.imageUrl} alt={ej.title} className="w-full h-full object-cover" />
                    : <span className="text-2xl">💪</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-['Oswald'] font-semibold uppercase truncate">{ej.title}</p>
                  <p className="text-white/40 text-xs truncate">
                    {ej.muscleGroups?.join(', ') || '—'}
                  </p>
                </div>

                {/* Badges */}
                <div className="hidden sm:flex gap-2 flex-shrink-0">
                  {ej.type && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorTipo[ej.type] ?? 'bg-white/10 text-white/50'}`}>
                      {TIPOS.find(t => t.value === ej.type)?.label ?? ej.type}
                    </span>
                  )}
                  {ej.difficulty && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorDificultad[ej.difficulty] ?? 'bg-white/10 text-white/50'}`}>
                      {DIFICULTADES.find(d => d.value === ej.difficulty)?.label ?? ej.difficulty}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => abrirEditar(ej)}
                    className="border border-white/20 text-white/60 px-3 py-2 rounded-lg text-sm hover:text-white hover:border-white/40 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmarEliminar(ej)}
                    className="border border-[#E63946]/30 text-[#E63946]/70 px-3 py-2 rounded-lg text-sm hover:bg-[#E63946]/10 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {ejerciciosFiltrados.length === 0 && !cargando && (
              <div className="text-center py-20 text-white/30">
                <p className="text-4xl mb-4">🔍</p>
                <p>No se encontraron ejercicios</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
              {editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </h3>

            <div className="flex flex-col gap-5">

              {/* Nombre */}
              <Campo label="Nombre *">
                <input
                  name="title"
                  value={formulario.title}
                  onChange={manejarCambio}
                  placeholder="Nombre del ejercicio"
                  className={inputCls}
                />
              </Campo>

              {/* Descripción */}
              <Campo label="Descripción">
                <textarea
                  name="description"
                  value={formulario.description}
                  onChange={manejarCambio}
                  placeholder="Descripción del ejercicio..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Campo>

              {/* URL imagen */}
              <Campo label="URL de imagen">
                <input
                  name="imageUrl"
                  value={formulario.imageUrl}
                  onChange={manejarCambio}
                  placeholder="https://..."
                  className={inputCls}
                />
                {formulario.imageUrl && (
                  <img
                    src={formulario.imageUrl}
                    alt="Vista previa"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-white/10"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </Campo>

              {/* Tipo + Dificultad */}
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Tipo">
                  <select name="type" value={formulario.type} onChange={manejarCambio} className={inputCls}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Dificultad">
                  <select name="difficulty" value={formulario.difficulty} onChange={manejarCambio} className={inputCls}>
                    {DIFICULTADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </Campo>
              </div>

              {/* Grupos musculares */}
              <Campo label="Grupos musculares (separados por coma)">
                <input
                  name="muscleGroupsText"
                  value={formulario.muscleGroupsText}
                  onChange={manejarCambio}
                  placeholder="Pecho, Tríceps, Hombros"
                  className={inputCls}
                />
              </Campo>

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
              Se eliminará <span className="text-white font-semibold">{confirmarEliminar.title}</span> del catálogo permanentemente.
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

// Helper: wrapper de campo con etiqueta
function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors w-full'
