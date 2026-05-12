import { useState } from 'react'
import api from '../../api/axios'

const UNITS = [
  { value: 'KG', label: 'kg' },
  { value: 'REPS', label: 'Peso corporal' },
  { value: 'SECONDS', label: 'Segundos' },
  { value: 'MINUTES', label: 'Minutos' },
]

export default function EditarEjercicioRutina({ routineId, routineExercise, onSave, onCancel }) {
  const { exercise } = routineExercise
  const [form, setForm] = useState({
    sets: routineExercise.sets ?? 3,
    reps: routineExercise.reps ?? 10,
    loadValue: routineExercise.loadValue ?? '',
    loadUnit: routineExercise.loadUnit ?? 'KG',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

  const guardar = async () => {
    const sets = parseInt(form.sets, 10)
    const reps = parseInt(form.reps, 10)
    if (!sets || sets < 1 || sets > 20) { setError('Series: debe estar entre 1 y 20'); return }
    if (!reps || reps < 1 || reps > 999) { setError('Reps: debe estar entre 1 y 999'); return }
    const loadValue = form.loadValue !== '' ? parseFloat(form.loadValue) : null
    if (loadValue !== null && loadValue < 0) { setError('La carga no puede ser negativa'); return }

    setGuardando(true)
    setError('')
    try {
      const { data } = await api.put(
        `/routines/${routineId}/exercises/${routineExercise.id}`,
        { sets, reps, loadValue, loadUnit: form.loadUnit }
      )
      onSave(data)
    } catch (err) {
      if (err.isForbidden) {
        setError('No tienes permiso para editar esta rutina')
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message ?? 'Datos inválidos')
      } else {
        setError('Error del servidor, intenta más tarde')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">

        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {exercise?.imageUrl
              ? <img src={exercise.imageUrl} alt={exercise.title} className="w-full h-full object-cover" />
              : <span className="text-2xl">💪</span>
            }
          </div>
          <div>
            <h3 className="font-['Oswald'] font-bold uppercase text-lg leading-tight">
              {exercise?.title}
            </h3>
            <p className="text-white/40 text-xs">{(exercise?.muscleGroups ?? []).join(', ')}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">Series</label>
            <input
              type="number" min="1" max="20" value={form.sets}
              onChange={e => set('sets', e.target.value)}
              className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-3 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">
              {exercise?.type === 'CARDIO' ? 'Intervalos' : 'Reps'}
            </label>
            <input
              type="number" min="1" max="999" value={form.reps}
              onChange={e => set('reps', e.target.value)}
              className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-3 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">
              {exercise?.type === 'CARDIO' ? 'Duración' : 'Carga'}
            </label>
            <input
              type="number" min="0" step="0.5" value={form.loadValue} placeholder="—"
              onChange={e => set('loadValue', e.target.value)}
              className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-3 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">Unidad</label>
            <select
              value={form.loadUnit}
              onChange={e => set('loadUnit', e.target.value)}
              className="w-full bg-[#222] border border-white/10 rounded-lg px-2 py-3 text-white text-sm outline-none focus:border-[#E63946] transition-colors"
            >
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-2 text-[#E63946] text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 bg-[#E63946] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors disabled:opacity-70"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
