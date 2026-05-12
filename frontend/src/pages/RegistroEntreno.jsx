import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RegistroEntreno() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [sesion, setSesion] = useState(null)
  const [rutina, setRutina] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [registros, setRegistros] = useState({})
  const [completando, setCompletando] = useState(false)
  const [abandonando, setAbandonando] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: sess } = await api.get(`/training-sessions/${sessionId}`)
        setSesion(sess)

        const { data: rut } = await api.get(`/routines/${sess.routineId}`)
        setRutina(rut)

        const ejercicios = [...(rut.routineExercises ?? [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        )
        const init = {}
        ejercicios.forEach(re => {
          init[re.id] = {
            routineExerciseId: re.id,
            setsCompleted: re.sets,
            repsCompleted: re.reps,
            loadCompleted: re.loadValue ?? '',
            loadUnit: re.loadUnit ?? 'KG',
            notes: '',
          }
        })
        setRegistros(init)

        const startedAt = new Date(sess.startedAt)
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
      } catch (err) {
        setError(err.isForbidden ? 'No tienes permiso' : 'No se pudo cargar la sesión')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [sessionId])

  useEffect(() => {
    if (sesion?.status !== 'STARTED') return
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [sesion?.status])

  const actualizar = (reId, campo, valor) => {
    setRegistros(prev => ({ ...prev, [reId]: { ...prev[reId], [campo]: valor } }))
  }

  const completar = async () => {
    setCompletando(true)
    setError('')
    try {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60))
      const exercises = Object.values(registros).map(r => ({
        routineExerciseId: r.routineExerciseId,
        setsCompleted: parseInt(r.setsCompleted, 10) || 1,
        repsCompleted: parseInt(r.repsCompleted, 10) || 1,
        loadCompleted: r.loadCompleted !== '' ? parseFloat(r.loadCompleted) : null,
        loadUnit: r.loadUnit || 'KG',
        notes: r.notes || null,
      }))
      await api.put(`/training-sessions/${sessionId}/complete`, {
        durationMinutes,
        exercises,
      })
      clearInterval(intervalRef.current)
      setMostrarExito(true)
    } catch (err) {
      setError('Error al completar el entrenamiento')
      setCompletando(false)
    }
  }

  const abandonar = async () => {
    if (!window.confirm('¿Abandonar este entrenamiento?')) return
    setAbandonando(true)
    try {
      await api.delete(`/training-sessions/${sessionId}`)
      navigate('/panel')
    } catch {
      setError('Error al abandonar')
      setAbandonando(false)
    }
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <p className="text-white/40">Cargando entrenamiento...</p>
    </div>
  )

  if (error && !sesion) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
      <p className="text-[#E63946]">{error}</p>
      <button onClick={() => navigate('/panel')} className="text-white/50 hover:text-white transition-colors">
        ← Volver al panel
      </button>
    </div>
  )

  const ejercicios = [...(rutina?.routineExercises ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-32">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111] sticky top-0 z-10">
        <div>
          <span className="font-['Oswald'] text-xl font-bold italic text-[#E63946]">STRIVE</span>
          <span className="text-white/30 text-xs ml-3 uppercase tracking-wider">Entrenando</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-['Oswald'] text-2xl font-bold text-[#E63946]">{formatElapsed(elapsed)}</p>
            <p className="text-white/30 text-xs uppercase tracking-wider">Tiempo</p>
          </div>
          <button
            onClick={abandonar}
            disabled={abandonando}
            className="border border-white/20 text-white/40 px-4 py-2 rounded-lg text-sm hover:text-[#E63946] hover:border-[#E63946]/40 transition-colors disabled:opacity-50"
          >
            Abandonar
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-8">

        <div className="mb-8">
          <h1 className="font-['Oswald'] text-4xl font-bold uppercase mb-1">{sesion?.routineName}</h1>
          <p className="text-white/40 text-sm">
            Iniciado a las {sesion?.startedAt ? new Date(sesion.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
          {sesion?.notes && (
            <p className="text-white/50 text-sm mt-2 italic">"{sesion.notes}"</p>
          )}
        </div>

        {error && (
          <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {ejercicios.map((re, index) => {
            const reg = registros[re.id] ?? {}
            const esCardio = re.exercise?.type === 'CARDIO'
            return (
              <div key={re.id} className="bg-[#1A1A1A] rounded-xl border border-white/5 p-5">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-['Oswald'] text-2xl font-bold text-[#E63946]/40 w-8 text-center">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {re.exercise?.imageUrl
                      ? <img src={re.exercise.imageUrl} alt={re.exercise.title} className="w-full h-full object-cover" />
                      : <span className="text-xl">💪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Oswald'] font-semibold uppercase truncate">{re.exercise?.title}</h3>
                    <p className="text-white/30 text-xs">
                      Planeado: {re.sets} × {re.reps}
                      {re.loadValue ? ` · ${re.loadValue} ${re.loadUnit}` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Series reales</label>
                    <input
                      type="number" min="1" max="20"
                      value={reg.setsCompleted ?? re.sets}
                      onChange={e => actualizar(re.id, 'setsCompleted', e.target.value)}
                      className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">
                      {esCardio ? 'Intervalos reales' : 'Reps reales'}
                    </label>
                    <input
                      type="number" min="1" max="999"
                      value={reg.repsCompleted ?? re.reps}
                      onChange={e => actualizar(re.id, 'repsCompleted', e.target.value)}
                      className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">
                      {esCardio ? 'Duración real' : 'Carga real'}
                    </label>
                    <input
                      type="number" min="0" step="0.5"
                      value={reg.loadCompleted ?? (re.loadValue ?? '')}
                      placeholder="—"
                      onChange={e => actualizar(re.id, 'loadCompleted', e.target.value)}
                      className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[#E63946] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Unidad</label>
                    <select
                      value={reg.loadUnit ?? re.loadUnit ?? 'KG'}
                      onChange={e => actualizar(re.id, 'loadUnit', e.target.value)}
                      className="w-full bg-[#222] border border-white/10 rounded-lg px-2 py-2 text-white text-sm outline-none focus:border-[#E63946] transition-colors"
                    >
                      {['KG', 'REPS', 'SECONDS', 'MINUTES'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Nota (opcional)</label>
                  <input
                    type="text"
                    value={reg.notes ?? ''}
                    onChange={e => actualizar(re.id, 'notes', e.target.value)}
                    placeholder="Ej: últimas 2 reps a tope..."
                    maxLength={500}
                    className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#E63946] transition-colors"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barra de acción fija */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/8 px-6 py-4">
        <button
          onClick={completar}
          disabled={completando}
          className="w-full bg-[#E63946] text-white py-4 rounded-xl font-['Oswald'] font-bold text-lg uppercase tracking-wider hover:bg-[#C1121F] transition-colors disabled:opacity-70"
        >
          {completando ? 'Guardando...' : 'Completar entrenamiento'}
        </button>
      </div>

      {/* Modal de éxito */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10 text-center">
            <p className="text-5xl mb-4">💪</p>
            <h3 className="font-['Oswald'] text-3xl font-bold uppercase mb-2">¡Entreno completado!</h3>
            <p className="text-white/50 text-sm mb-2">{sesion?.routineName}</p>
            <p className="text-[#E63946] font-['Oswald'] text-xl font-bold mb-8">
              {formatElapsed(elapsed)}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/historial')}
                className="bg-[#E63946] text-white py-3 rounded-lg font-bold hover:bg-[#C1121F] transition-colors"
              >
                Ver historial
              </button>
              <button
                onClick={() => navigate('/panel')}
                className="border border-white/20 text-white/60 py-3 rounded-lg hover:text-white transition-colors text-sm"
              >
                Volver al panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
