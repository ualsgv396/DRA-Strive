import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import ExportRoutinePDF from '../components/rutina/ExportRoutinePDF'
import ItemEjercicioRutina from '../components/rutina/ItemEjercicioRutina'
import EditarEjercicioRutina from '../components/rutina/EditarEjercicioRutina'
import IniciarEntreno from '../components/entreno/IniciarEntreno'
import ModalBuscarEjercicio from '../components/rutina/ModalBuscarEjercicio'
import ModalCompartirRutina from '../components/chat/ModalCompartirRutina'

export default function DetalleRutina() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rutina, setRutina] = useState(null)
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [ultimaSesion, setUltimaSesion] = useState(null)
  const [sesionesRutina, setSesionesRutina] = useState([])
  const [ejercicioEditando, setEjercicioEditando] = useState(null)
  const [mostrarIniciar, setMostrarIniciar] = useState(false)
  const [mostrarAnadirEjercicio, setMostrarAnadirEjercicio] = useState(false)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState('')
  const [objetivoEdit, setObjetivoEdit] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  useEffect(() => {
    api.get(`/routines/${id}`)
      .then(r => {
        setRutina(r.data)
        setEjercicios(sortedBy(r.data.routineExercises ?? []))
      })
      .catch(err => {
        if (err.isForbidden) {
          setError('No tienes permiso para ver esta rutina')
        } else {
          setError('No se pudo cargar la rutina')
        }
      })
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => {
    api.get(`/training-sessions/routine/${id}`)
      .then(r => {
        const data = r.data ?? []
        setSesionesRutina(data)
        const completada = data.find(s => s.status === 'COMPLETED')
        if (completada) setUltimaSesion(completada.startedAt)
      })
      .catch(() => {})
  }, [id])

  const sortedBy = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const formatUltimaSesion = (iso) => {
    const dias = Math.floor((Date.now() - new Date(iso)) / 86400000)
    if (dias === 0) return 'hoy'
    if (dias === 1) return 'hace 1 día'
    if (dias < 30)  return `hace ${dias} días`
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const handleDuplicar = async () => {
    setDuplicando(true)
    try {
      const { data } = await api.post(`/routines/${id}/duplicate`)
      navigate(`/rutina/${data.id}`)
    } catch {
      setError('Error al duplicar la rutina')
      setDuplicando(false)
    }
  }

  const eliminarRutina = async () => {
    setEliminando(true)
    try {
      await api.delete(`/routines/${id}`)
      navigate('/panel')
    } catch (err) {
      if (err.isForbidden) {
        setError('No tienes permiso para eliminar esta rutina')
        setMostrarConfirmar(false)
      } else {
        setError('Error al eliminar la rutina')
      }
      setEliminando(false)
    }
  }

  const handleEliminarEjercicio = async (routineExerciseId) => {
    try {
      await api.delete(`/routines/${id}/exercises/${routineExerciseId}`)
      setEjercicios(prev => prev.filter(re => re.id !== routineExerciseId))
    } catch (err) {
      setError(err.isForbidden ? 'No tienes permiso' : 'Error al eliminar el ejercicio')
    }
  }

  const handleEditarRutina = () => {
    setNombreEdit(rutina.name)
    setObjetivoEdit(rutina.goal ?? '')
    setEditando(true)
  }

  const handleGuardarRutina = async () => {
    if (!nombreEdit.trim()) return
    setGuardandoEdit(true)
    try {
      const { data } = await api.patch(`/routines/${id}`, {
        name: nombreEdit.trim(),
        goal: objetivoEdit.trim() || null,
      })
      setRutina(data)
      setEditando(false)
    } catch {
      setError('Error al guardar los cambios')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const handleEjercicioAnadido = (routineExercise) => {
    setEjercicios(prev => [...prev, routineExercise])
    setMostrarAnadirEjercicio(false)
  }

  const handleGuardarEdicion = (updatedRe) => {
    setEjercicios(prev => prev.map(re => re.id === updatedRe.id ? updatedRe : re))
    setEjercicioEditando(null)
  }

  const handleMover = async (routineExercise, direccion) => {
    const idx = ejercicios.findIndex(re => re.id === routineExercise.id)
    const targetIdx = idx + direccion
    if (targetIdx < 0 || targetIdx >= ejercicios.length) return

    const updated = [...ejercicios]
    const tmpOrder = updated[idx].sortOrder
    updated[idx] = { ...updated[idx], sortOrder: updated[targetIdx].sortOrder }
    updated[targetIdx] = { ...updated[targetIdx], sortOrder: tmpOrder }
    setEjercicios(sortedBy(updated))

    try {
      await api.patch(`/routines/${id}/exercises/reorder`, [
        { routineExerciseId: updated[idx].id, sortOrder: updated[idx].sortOrder },
        { routineExerciseId: updated[targetIdx].id, sortOrder: updated[targetIdx].sortOrder },
      ])
    } catch {
      // revert on error
      api.get(`/routines/${id}`)
        .then(r => setEjercicios(sortedBy(r.data.routineExercises ?? [])))
    }
  }

  const totalSeries = ejercicios.reduce((acc, re) => acc + (re.sets ?? 0), 0)
  const totalReps   = ejercicios.reduce((acc, re) => acc + (re.sets ?? 0) * (re.reps ?? 0), 0)

  const sesCompletas    = sesionesRutina.filter(s => s.status === 'COMPLETED')
  const vecesCompletada = sesCompletas.length
  const tiempoTotalMin  = sesCompletas.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
  const avgMin          = vecesCompletada > 0 ? Math.round(tiempoTotalMin / vecesCompletada) : 0
  const th = Math.floor(tiempoTotalMin / 60)
  const tm = tiempoTotalMin % 60
  const tiempoTotalLabel = (() => {
    if (tiempoTotalMin === 0) return '—'
    if (tiempoTotalMin < 60) return `${tiempoTotalMin}m`
    if (tm > 0) return `${th}h ${tm}m`
    return `${th}h`
  })()

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
        <button
          onClick={() => setMostrarConfirmar(true)}
          className="border border-[#E63946]/40 text-[#E63946] px-4 py-2 rounded-lg text-sm hover:bg-[#E63946]/10 transition-colors"
        >
          Eliminar rutina
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-10 pb-28">

        {/* Cabecera */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/panel')}
            className="text-white/40 text-sm hover:text-white transition-colors mb-6 flex items-center gap-2"
          >
            ← Mis rutinas
          </button>

          {editando ? (
            <div className="flex flex-col gap-4">
              <input
                autoFocus
                value={nombreEdit}
                onChange={e => setNombreEdit(e.target.value)}
                placeholder="Nombre de la rutina"
                className="bg-transparent border-b-2 border-[#E63946] font-['Oswald'] text-4xl md:text-5xl font-bold uppercase text-white outline-none pb-1 w-full"
              />
              <input
                value={objetivoEdit}
                onChange={e => setObjetivoEdit(e.target.value)}
                placeholder="Objetivo (opcional)"
                className="bg-transparent border-b border-white/20 text-white/60 text-base outline-none pb-1 w-full focus:border-white/40 transition-colors"
              />
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleGuardarRutina}
                  disabled={guardandoEdit || !nombreEdit.trim()}
                  className="bg-[#E63946] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors disabled:opacity-50"
                >
                  {guardandoEdit ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="border border-white/20 text-white/50 px-5 py-2 rounded-lg text-sm hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <h1 className="font-['Oswald'] text-5xl md:text-6xl font-bold uppercase mb-4">
                {rutina?.name}
              </h1>
              {rutina?.goal && (
                <p className="text-white/50 text-lg max-w-2xl leading-relaxed">{rutina.goal}</p>
              )}
              <button
                onClick={handleEditarRutina}
                className="mt-4 text-white/30 text-sm hover:text-white/70 transition-colors flex items-center gap-1.5"
              >
                ✎ Editar nombre y objetivo
              </button>
            </div>
          )}

          {ultimaSesion && !editando && (
            <p className="text-white/30 text-sm mt-3">
              Última sesión: <span className="text-white/55">{formatUltimaSesion(ultimaSesion)}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { valor: ejercicios.length, etiqueta: 'Ejercicios' },
            { valor: totalSeries,       etiqueta: 'Series totales' },
            { valor: totalReps,         etiqueta: 'Reps totales' }
          ].map((stat) => (
            <div key={stat.etiqueta} className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-white/5">
              <p className="font-['Oswald'] text-4xl font-bold text-[#E63946] mb-1">{stat.valor}</p>
              <p className="text-white/40 text-sm">{stat.etiqueta}</p>
            </div>
          ))}
        </div>

        {/* Stats historial de la rutina */}
        {vecesCompletada > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-[2px] text-white/30">
                Historial de esta rutina
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { valor: vecesCompletada,  etiqueta: 'Veces completada' },
                { valor: tiempoTotalLabel, etiqueta: 'Tiempo total'      },
                { valor: `${avgMin}m`,     etiqueta: 'Duración media'    },
              ].map(stat => (
                <div key={stat.etiqueta} className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-white/5">
                  <p className="font-['Oswald'] text-4xl font-bold mb-1" style={{ color: '#4ECDC4' }}>{stat.valor}</p>
                  <p className="text-white/40 text-sm">{stat.etiqueta}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error inline */}
        {error && rutina && (
          <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm mb-6">
            {error}
          </div>
        )}

        {/* Lista ejercicios */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Oswald'] text-2xl font-bold uppercase">Ejercicios</h2>
            <button
              onClick={() => setMostrarAnadirEjercicio(true)}
              className="border border-white/20 text-white/60 px-4 py-2 rounded-lg text-sm font-semibold hover:text-white hover:border-white/40 transition-colors"
            >
              + Añadir
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {ejercicios.map((re, index) => (
              <ItemEjercicioRutina
                key={re.id}
                routineExercise={re}
                index={index}
                total={ejercicios.length}
                onEdit={setEjercicioEditando}
                onDelete={handleEliminarEjercicio}
                onMoveUp={re => handleMover(re, -1)}
                onMoveDown={re => handleMover(re, 1)}
              />
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setMostrarIniciar(true)}
            className="w-full bg-[#E63946] text-white py-5 rounded-xl font-['Oswald'] font-bold text-xl uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
          >
            ▶ Iniciar entrenamiento
          </button>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/rutina/nueva')}
              className="flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors"
            >
              + Nueva rutina
            </button>
            <button
              onClick={handleDuplicar}
              disabled={duplicando}
              className="flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors disabled:opacity-50"
            >
              {duplicando ? 'Duplicando...' : '⎘ Duplicar rutina'}
            </button>
            <ExportRoutinePDF rutina={rutina} />
            <button
              onClick={() => setMostrarCompartir(true)}
              className="flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors"
            >
              ↗ Compartir
            </button>
            <button
              onClick={() => navigate('/ejercicios')}
              className="flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors"
            >
              Ver ejercicios
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMAR ELIMINAR RUTINA */}
      {mostrarConfirmar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-3">¿Eliminar rutina?</h3>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Esta acción no se puede deshacer. Se eliminará{' '}
              <span className="text-white font-semibold">{rutina?.name}</span>{' '}permanentemente.
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

      {/* MODAL EDITAR EJERCICIO */}
      {ejercicioEditando && (
        <EditarEjercicioRutina
          routineId={id}
          routineExercise={ejercicioEditando}
          onSave={handleGuardarEdicion}
          onCancel={() => setEjercicioEditando(null)}
        />
      )}

      {/* MODAL INICIAR ENTRENAMIENTO */}
      {mostrarIniciar && (
        <IniciarEntreno
          routineId={Number.parseInt(id, 10)}
          routineName={rutina?.name}
          onCancel={() => setMostrarIniciar(false)}
        />
      )}

      {/* MODAL AÑADIR EJERCICIO */}
      {mostrarAnadirEjercicio && (
        <ModalBuscarEjercicio
          rutinaId={id}
          onAnadido={handleEjercicioAnadido}
          onCerrar={() => setMostrarAnadirEjercicio(false)}
        />
      )}

      {/* MODAL COMPARTIR RUTINA */}
      {mostrarCompartir && rutina && (
        <ModalCompartirRutina
          rutina={rutina}
          onCerrar={() => setMostrarCompartir(false)}
        />
      )}
    </div>
  )
}
