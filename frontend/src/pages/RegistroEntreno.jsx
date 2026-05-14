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

  // Stepper +/- (mantiene la misma llamada actualizar(reId, campo, valor))
  const ajustar = (reId, campo, delta, min = 0, max = 999) => {
    const actual = parseInt(registros[reId]?.[campo], 10)
    const base = isNaN(actual) ? 0 : actual
    const nuevo = Math.max(min, Math.min(max, base + delta))
    actualizar(reId, campo, String(nuevo))
  }
  const ajustarFloat = (reId, campo, delta, min = 0) => {
    const actual = parseFloat(registros[reId]?.[campo])
    const base = isNaN(actual) ? 0 : actual
    const nuevo = Math.max(min, base + delta)
    actualizar(reId, campo, String(Math.round(nuevo * 10) / 10))
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
      <p className="text-white/45 text-sm">Cargando entrenamiento...</p>
    </div>
  )

  if (error && !sesion) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
      <p className="text-[#FF6B7A]">{error}</p>
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

      {/* NAVBAR — timer dominante */}
      <nav
        className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 md:px-8 py-3 border-b border-white/[0.06] sticky top-0 z-20"
        style={{
          background: 'rgba(15,15,15,0.86)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="flex flex-col">
          <span className="font-['Oswald'] text-[18px] font-bold italic text-[#E63946] leading-none tracking-[2px]">STRIVE</span>
          <span className="mt-1 text-[9px] font-mono uppercase tracking-[1.4px] leading-none text-white/45">
            <span className="text-[#FF6B7A]">●</span> Entrenando
          </span>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-mono uppercase tracking-[1.4px] text-white/45">Tiempo</p>
          <p
            className="font-mono text-[26px] md:text-[28px] font-bold leading-tight text-white"
            style={{ textShadow: '0 0 18px rgba(230,57,70,0.45)' }}
          >
            {formatElapsed(elapsed)}
          </p>
        </div>
        <button
          onClick={abandonar}
          disabled={abandonando}
          className="h-9 px-3 rounded-[10px] text-[11px] font-semibold tracking-[0.5px] transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(230,57,70,0.06)',
            color: '#FF6B7A',
            border: '1px solid rgba(230,57,70,0.30)',
          }}
        >
          Abandonar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6">

        {/* Hero summary */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block text-[10px] font-semibold tracking-[1.5px] uppercase px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(230,57,70,0.10)',
                color: '#FF6B7A',
                border: '1px solid rgba(230,57,70,0.30)',
              }}
            >
              Sesión activa
            </span>
            {sesion?.startedAt && (
              <span className="text-[11px] text-white/45">
                · iniciada {new Date(sesion.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h1
            className="font-['Oswald'] text-[32px] md:text-[40px] font-bold uppercase tracking-[0.5px] leading-none"
            style={{
              background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 130%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {sesion?.routineName}
          </h1>
          {sesion?.notes && (
            <p className="text-white/50 text-sm mt-3 italic">"{sesion.notes}"</p>
          )}

          {/* Progress hint: count of exercises */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #E63946, #FF8C42)',
                  boxShadow: '0 0 12px rgba(230,57,70,0.6)',
                }}
              />
            </div>
            <span className="font-mono text-[10px] tracking-[1.2px] text-white/45 uppercase">
              {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
            </span>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-6"
            style={{
              background: 'rgba(230,57,70,0.10)',
              border: '1px solid rgba(230,57,70,0.40)',
              color: '#FF6B7A',
            }}
          >
            {error}
          </div>
        )}

        {/* Lista de ejercicios */}
        <div className="flex flex-col gap-4">
          {ejercicios.map((re, index) => {
            const reg = registros[re.id] ?? {}
            const esCardio = re.exercise?.type === 'CARDIO'
            return (
              <div
                key={re.id}
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)',
                }}
              >
                {/* Cabecera */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 font-['Oswald'] font-bold text-[14px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden"
                       style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {re.exercise?.imageUrl
                      ? <img src={re.exercise.imageUrl} alt={re.exercise.title} className="w-full h-full object-cover" />
                      : <span className="text-lg opacity-65">💪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Oswald'] font-semibold text-[15px] uppercase tracking-[0.5px] truncate">
                      {re.exercise?.title}
                    </h3>
                    <p className="text-white/45 text-[10px] font-mono tracking-[0.3px] mt-0.5">
                      Plan · {re.sets} × {re.reps}{re.loadValue ? ` · ${re.loadValue} ${re.loadUnit}` : ''}
                    </p>
                  </div>
                </div>

                {/* Métricas grandes: Series / Reps / Carga */}
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {/* Series */}
                  <MetricCard label="Series">
                    <BigInput
                      value={reg.setsCompleted ?? re.sets}
                      onChange={v => actualizar(re.id, 'setsCompleted', v)}
                      min={1} max={20} step={1}
                      onMinus={() => ajustar(re.id, 'setsCompleted', -1, 1, 20)}
                      onPlus={() => ajustar(re.id, 'setsCompleted', +1, 1, 20)}
                    />
                  </MetricCard>

                  {/* Reps / Intervalos */}
                  <MetricCard label={esCardio ? 'Intervalos' : 'Reps'}>
                    <BigInput
                      value={reg.repsCompleted ?? re.reps}
                      onChange={v => actualizar(re.id, 'repsCompleted', v)}
                      min={1} max={999} step={1}
                      onMinus={() => ajustar(re.id, 'repsCompleted', -1, 1, 999)}
                      onPlus={() => ajustar(re.id, 'repsCompleted', +1, 1, 999)}
                    />
                  </MetricCard>

                  {/* Carga (acento rojo) */}
                  <MetricCard label={esCardio ? 'Duración' : 'Carga'} accent>
                    <BigInputLoad
                      value={reg.loadCompleted ?? (re.loadValue ?? '')}
                      unit={reg.loadUnit ?? re.loadUnit ?? 'KG'}
                      onChange={v => actualizar(re.id, 'loadCompleted', v)}
                      onMinus={() => ajustarFloat(re.id, 'loadCompleted', -2.5, 0)}
                      onPlus={() => ajustarFloat(re.id, 'loadCompleted', +2.5, 0)}
                    />
                  </MetricCard>
                </div>

                {/* Unidad */}
                <div className="mb-3">
                  <label className="text-white/45 font-mono text-[9px] uppercase tracking-[1.4px] block mb-1.5">
                    Unidad
                  </label>
                  <div className="flex gap-1.5">
                    {['KG', 'REPS', 'SECONDS', 'MINUTES'].map(u => {
                      const active = (reg.loadUnit ?? re.loadUnit ?? 'KG') === u
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => actualizar(re.id, 'loadUnit', u)}
                          className="flex-1 h-9 rounded-[10px] text-[11px] font-semibold tracking-[1px] uppercase transition-colors"
                          style={
                            active
                              ? {
                                  background: 'rgba(230,57,70,0.10)',
                                  color: '#FF6B7A',
                                  border: '1px solid rgba(230,57,70,0.35)',
                                  boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.10)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.02)',
                                  color: 'rgba(255,255,255,0.55)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }
                          }
                        >
                          {u}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nota */}
                <div>
                  <label className="text-white/45 font-mono text-[9px] uppercase tracking-[1.4px] block mb-1.5">
                    Nota (opcional)
                  </label>
                  <input
                    type="text"
                    value={reg.notes ?? ''}
                    onChange={e => actualizar(re.id, 'notes', e.target.value)}
                    placeholder="Ej: últimas 2 reps a tope..."
                    maxLength={500}
                    className="w-full h-10 px-3 rounded-[10px] text-[13px] outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barra de acción fija */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 md:px-8 py-3 border-t border-white/[0.06]"
        style={{
          background: 'rgba(15,15,15,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <button
            onClick={completar}
            disabled={completando}
            className="w-full h-[56px] rounded-[14px] font-['Oswald'] font-bold text-[15px] uppercase tracking-[1.6px] disabled:opacity-70 inline-flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99]"
            style={{
              background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
              color: '#fff',
              border: '1px solid rgba(230,57,70,0.85)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.20), 0 12px 28px rgba(230,57,70,0.35)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12 5 5 11-11"/>
            </svg>
            {completando ? 'Guardando...' : 'Completar entrenamiento'}
          </button>
        </div>
      </div>

      {/* Modal de éxito */}
      {mostrarExito && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="rounded-3xl p-8 max-w-sm w-full text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 18px 48px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
            }}
          >
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                 style={{
                   background: 'rgba(230,57,70,0.10)',
                   border: '1px solid rgba(230,57,70,0.30)',
                   boxShadow: '0 0 30px rgba(230,57,70,0.35)',
                 }}>
              <span className="text-4xl">💪</span>
            </div>
            <h3 className="font-['Oswald'] text-[28px] font-bold uppercase tracking-[0.5px] mb-1">¡Entreno completado!</h3>
            <p className="text-white/45 text-sm mb-3">{sesion?.routineName}</p>
            <p className="font-mono text-[#FF6B7A] text-[22px] font-bold mb-7"
               style={{ textShadow: '0 0 18px rgba(230,57,70,0.45)' }}>
              {formatElapsed(elapsed)}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/historial')}
                className="h-[48px] rounded-xl font-['Oswald'] font-bold text-[13px] uppercase tracking-[1.4px]"
                style={{
                  background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
                  color: '#fff',
                  border: '1px solid rgba(230,57,70,0.85)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 22px rgba(230,57,70,0.32)',
                }}
              >
                Ver historial
              </button>
              <button
                onClick={() => navigate('/panel')}
                className="h-[44px] rounded-xl text-[12px] font-semibold tracking-[1.2px] uppercase"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
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

/* ─── Subcomponentes visuales ───────────────────────────────────────────── */

function MetricCard({ label, accent = false, children }) {
  return (
    <div
      className="rounded-[12px] py-2.5 px-2 flex flex-col items-center gap-2"
      style={
        accent
          ? {
              background: 'rgba(230,57,70,0.05)',
              border: '1px solid rgba(230,57,70,0.30)',
            }
          : {
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
            }
      }
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[1.4px]"
        style={{ color: accent ? '#FF6B7A' : 'rgba(255,255,255,0.45)' }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function BigInput({ value, onChange, onMinus, onPlus, min, max }) {
  return (
    <>
      <input
        type="number"
        inputMode="numeric"
        min={min} max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent outline-none border-none text-center font-['Oswald'] font-bold leading-none"
        style={{ color: '#fff', fontSize: '32px' }}
      />
      <Steppers onMinus={onMinus} onPlus={onPlus} />
    </>
  )
}

function BigInputLoad({ value, unit, onChange, onMinus, onPlus }) {
  return (
    <>
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          inputMode="decimal"
          min={0} step="0.5"
          value={value}
          placeholder="—"
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent outline-none border-none text-right font-['Oswald'] font-bold leading-none"
          style={{ color: '#fff', fontSize: '32px', minWidth: 0 }}
        />
        <span className="text-[11px] font-semibold" style={{ color: '#FF6B7A' }}>{unit}</span>
      </div>
      <Steppers onMinus={onMinus} onPlus={onPlus} tone="red" />
    </>
  )
}

function Steppers({ onMinus, onPlus, tone = 'neutral' }) {
  const isRed = tone === 'red'
  const baseStyle = isRed
    ? {
        background: 'rgba(230,57,70,0.10)',
        color: '#FF6B7A',
        border: '1px solid rgba(230,57,70,0.35)',
      }
    : {
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.10)',
      }
  return (
    <div className="flex gap-1.5 mt-1">
      <button
        type="button"
        onClick={onMinus}
        className="w-[30px] h-[30px] rounded-lg inline-flex items-center justify-center text-base font-semibold transition-opacity active:opacity-70"
        style={baseStyle}
      >
        −
      </button>
      <button
        type="button"
        onClick={onPlus}
        className="w-[30px] h-[30px] rounded-lg inline-flex items-center justify-center text-base font-semibold transition-opacity active:opacity-70"
        style={baseStyle}
      >
        +
      </button>
    </div>
  )
}
