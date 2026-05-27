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
  const [resumen, setResumen] = useState(null)
  const [mostrarModalAbandonar, setMostrarModalAbandonar] = useState(false)
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState(new Set())
  const [ultimasCargas, setUltimasCargas] = useState({})
  const [notaSesion, setNotaSesion] = useState('')
  const [descanso, setDescanso] = useState(null)
  const intervalRef = useRef(null)
  const descansoRef = useRef(null)

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

        // Cargar última sesión completada de esta rutina para mostrar referencia de carga
        try {
          const { data: historial } = await api.get(`/training-sessions/routine/${sess.routineId}`)
          const ultima = [...(historial ?? [])]
            .filter(s => s.status === 'COMPLETED' && String(s.id) !== String(sessionId))
            .sort((a, b) => new Date(b.completedAt ?? b.startedAt) - new Date(a.completedAt ?? a.startedAt))[0]
          if (ultima?.exercises?.length > 0) {
            const mapa = {}
            ultima.exercises.forEach(rec => {
              if (rec.routineExercise?.id != null) mapa[rec.routineExercise.id] = rec
            })
            setUltimasCargas(mapa)
          }
        } catch {
          // no bloquea la carga principal
        }
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

  useEffect(() => () => clearInterval(descansoRef.current), [])

  const actualizar = (reId, campo, valor) => {
    setRegistros(prev => ({ ...prev, [reId]: { ...prev[reId], [campo]: valor } }))
  }

  const iniciarDescanso = (duracion) => {
    clearInterval(descansoRef.current)
    setDescanso({ restantes: duracion, duracion })
    descansoRef.current = setInterval(() => {
      setDescanso(prev => {
        if (!prev || prev.restantes <= 1) {
          clearInterval(descansoRef.current)
          return null
        }
        return { ...prev, restantes: prev.restantes - 1 }
      })
    }, 1000)
  }

  const cancelarDescanso = () => {
    clearInterval(descansoRef.current)
    setDescanso(null)
  }

  const toggleCompletado = (reId) => {
    const estabaHecho = ejerciciosCompletados.has(reId)
    setEjerciciosCompletados(prev => {
      const s = new Set(prev)
      if (s.has(reId)) s.delete(reId)
      else s.add(reId)
      return s
    })
    if (!estabaHecho) iniciarDescanso(90)
  }

  const ajustar = (reId, campo, delta, min = 0, max = 999) => {
    const actual = Number.parseInt(registros[reId]?.[campo], 10)
    const base = Number.isNaN(actual) ? 0 : actual
    const nuevo = Math.max(min, Math.min(max, base + delta))
    actualizar(reId, campo, String(nuevo))
  }
  const ajustarFloat = (reId, campo, delta, min = 0) => {
    const actual = Number.parseFloat(registros[reId]?.[campo])
    const base = Number.isNaN(actual) ? 0 : actual
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
        setsCompleted: Number.parseInt(r.setsCompleted, 10) || 1,
        repsCompleted: Number.parseInt(r.repsCompleted, 10) || 1,
        loadCompleted: r.loadCompleted === '' ? null : Number.parseFloat(r.loadCompleted),
        loadUnit: r.loadUnit || 'KG',
        notes: r.notes || null,
      }))
      await api.put(`/training-sessions/${sessionId}/complete`, {
        durationMinutes,
        exercises,
        notes: notaSesion.trim() || null,
      })
      clearInterval(intervalRef.current)
      const totalSeries = exercises.reduce((acc, r) => acc + (r.setsCompleted || 0), 0)
      const totalReps   = exercises.reduce((acc, r) => acc + (r.setsCompleted || 0) * (r.repsCompleted || 0), 0)
      const ejerciciosResumen = ejercicios.map(re => {
        const reg = registros[re.id] ?? {}
        const ultima = ultimasCargas[re.id]
        const loadActual = (reg.loadCompleted === '' || reg.loadCompleted == null)
          ? null
          : Number.parseFloat(reg.loadCompleted)
        const loadAnterior = ultima?.loadCompleted ?? null
        const esPR = loadActual != null && loadAnterior != null && loadActual > loadAnterior
        return {
          titulo:    re.exercise?.title ?? `Ejercicio ${re.id}`,
          sets:      Number.parseInt(reg.setsCompleted, 10) || 1,
          reps:      Number.parseInt(reg.repsCompleted, 10) || 1,
          load:      Number.isNaN(loadActual) ? null : loadActual,
          unit:      reg.loadUnit || 'KG',
          esPR,
          completado: ejerciciosCompletados.has(re.id),
        }
      })
      setResumen({ numEjercicios: exercises.length, totalSeries, totalReps, durationMinutes, ejerciciosResumen })
      setMostrarExito(true)
    } catch (err) {
      setError('Error al completar el entrenamiento')
      setCompletando(false)
    }
  }

  const abandonar = () => setMostrarModalAbandonar(true)

  const confirmarAbandonar = async () => {
    setAbandonando(true)
    try {
      await api.delete(`/training-sessions/${sessionId}`)
      navigate('/panel')
    } catch {
      setError('Error al abandonar')
      setAbandonando(false)
      setMostrarModalAbandonar(false)
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

        {/* Temporizador de descanso */}
        {descanso && (
          <div
            className="rounded-2xl px-5 py-3.5 mb-5 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(230,57,70,0.10), rgba(230,57,70,0.05))',
              border: '1px solid rgba(230,57,70,0.28)',
            }}
          >
            <div className="flex flex-col min-w-[52px]">
              <span className="font-mono text-[9px] uppercase tracking-[1.4px] text-white/35">Descanso</span>
              <span
                className="font-['Oswald'] text-[30px] font-bold leading-none tabular-nums"
                style={{
                  color: descanso.restantes <= 10 ? '#FF6B7A' : '#fff',
                  textShadow: descanso.restantes <= 10 ? '0 0 14px rgba(230,57,70,0.6)' : 'none',
                  transition: 'color 0.3s, text-shadow 0.3s',
                }}
              >
                {String(Math.floor(descanso.restantes / 60)).padStart(2, '0')}:{String(descanso.restantes % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(descanso.restantes / descanso.duracion) * 100}%`,
                  background: descanso.restantes <= 10
                    ? 'linear-gradient(90deg, #E63946, #FF8C42)'
                    : 'linear-gradient(90deg, #22c55e, #4ade80)',
                  transition: 'width 1s linear, background 0.3s',
                }}
              />
            </div>

            <div className="flex gap-1.5 shrink-0">
              {[60, 90, 120].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => iniciarDescanso(s)}
                  className="h-7 px-2.5 rounded-lg font-mono text-[10px] tracking-[0.5px] transition-colors"
                  style={{
                    background: descanso.duracion === s ? 'rgba(230,57,70,0.18)' : 'rgba(255,255,255,0.04)',
                    color: descanso.duracion === s ? '#FF6B7A' : 'rgba(255,255,255,0.38)',
                    border: `1px solid ${descanso.duracion === s ? 'rgba(230,57,70,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {s}s
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={cancelarDescanso}
              className="text-white/25 hover:text-white/60 transition-colors text-sm shrink-0"
              aria-label="Cerrar temporizador"
            >
              ✕
            </button>
          </div>
        )}

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
                  width: `${ejercicios.length > 0 ? Math.round((ejerciciosCompletados.size / ejercicios.length) * 100) : 0}%`,
                  background: ejerciciosCompletados.size === ejercicios.length && ejercicios.length > 0
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #E63946, #FF8C42)',
                  boxShadow: ejerciciosCompletados.size === ejercicios.length && ejercicios.length > 0
                    ? '0 0 12px rgba(34,197,94,0.6)'
                    : '0 0 12px rgba(230,57,70,0.6)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span className="font-mono text-[10px] tracking-[1.2px] text-white/45 uppercase">
              {ejerciciosCompletados.size}/{ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
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
            const hecho = ejerciciosCompletados.has(re.id)
            return (
              <div
                key={re.id}
                className="rounded-2xl p-4 transition-all"
                style={
                  hecho
                    ? {
                        background: 'linear-gradient(180deg, rgba(34,197,94,0.04), rgba(255,255,255,0)) , #141414',
                        border: '1px solid rgba(34,197,94,0.25)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)',
                      }
                    : {
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)',
                      }
                }
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

                {/* Referencia última sesión */}
                {ultimasCargas[re.id] && (
                  <p
                    className="font-mono text-[10px] tracking-[0.8px] mt-2 px-1"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                  >
                    Última · {ultimasCargas[re.id].setsCompleted} × {ultimasCargas[re.id].repsCompleted}
                    {ultimasCargas[re.id].loadCompleted != null && (
                      <span style={{ color: '#FF6B7A' }}>
                        {' '}· {ultimasCargas[re.id].loadCompleted} {ultimasCargas[re.id].loadUnit ?? ''}
                      </span>
                    )}
                  </p>
                )}

                {/* Marcar ejercicio como completado */}
                <button
                  type="button"
                  onClick={() => toggleCompletado(re.id)}
                  className="w-full mt-2 h-11 rounded-[10px] font-['Oswald'] font-bold text-[12px] uppercase tracking-[1.2px] transition-all"
                  style={
                    ejerciciosCompletados.has(re.id)
                      ? {
                          background: 'rgba(34,197,94,0.10)',
                          color: '#4ade80',
                          border: '1px solid rgba(34,197,94,0.35)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          color: 'rgba(255,255,255,0.45)',
                          border: '1px solid rgba(255,255,255,0.10)',
                        }
                  }
                >
                  {ejerciciosCompletados.has(re.id) ? '✓ Completado' : 'Marcar como completado'}
                </button>
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
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <textarea
            value={notaSesion}
            onChange={e => setNotaSesion(e.target.value)}
            placeholder="Nota del entreno (opcional)..."
            maxLength={500}
            rows={1}
            className="w-full resize-none rounded-[10px] px-3 py-2 text-[13px] outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(230,57,70,0.45)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          {ejerciciosCompletados.size === ejercicios.length && ejercicios.length > 0 && (
            <p className="text-center font-mono text-[10px] uppercase tracking-[1.4px] text-[#4ade80]">
              ¡Todos los ejercicios completados!
            </p>
          )}
          <button
            onClick={completar}
            disabled={completando}
            className="w-full h-[56px] rounded-[14px] font-['Oswald'] font-bold text-[15px] uppercase tracking-[1.6px] disabled:opacity-70 inline-flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
            style={
              ejerciciosCompletados.size === ejercicios.length && ejercicios.length > 0
                ? {
                    background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff',
                    border: '1px solid rgba(34,197,94,0.85)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.20), 0 12px 28px rgba(34,197,94,0.40)',
                  }
                : {
                    background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
                    color: '#fff',
                    border: '1px solid rgba(230,57,70,0.85)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.20), 0 12px 28px rgba(230,57,70,0.35)',
                  }
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12 5 5 11-11"/>
            </svg>
            {completando ? 'Guardando...' : 'Completar entrenamiento'}
          </button>
        </div>
      </div>

      {/* Modal confirmar abandono */}
      {mostrarModalAbandonar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-3">¿Abandonar?</h3>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              El entrenamiento no se guardará en tu historial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModalAbandonar(false)}
                disabled={abandonando}
                className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Continuar
              </button>
              <button
                onClick={confirmarAbandonar}
                disabled={abandonando}
                className="flex-1 bg-[#E63946] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors disabled:opacity-70"
              >
                {abandonando ? 'Saliendo...' : 'Abandonar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito — resumen post-entrenamiento */}
      {mostrarExito && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        >
          <div
            className="rounded-3xl w-full max-w-md overflow-hidden flex flex-col"
            style={{
              maxHeight: '88vh',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset',
            }}
          >
            {/* Cabecera fija */}
            <div className="px-7 pt-7 pb-4 text-center shrink-0">
              <div
                className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(230,57,70,0.10)',
                  border: '1px solid rgba(230,57,70,0.30)',
                  boxShadow: '0 0 30px rgba(230,57,70,0.35)',
                }}
              >
                <span className="text-3xl">💪</span>
              </div>
              <h3 className="font-['Oswald'] text-[26px] font-bold uppercase tracking-[0.5px] mb-1">
                ¡Entreno completado!
              </h3>
              <p className="text-white/45 text-sm mb-2">{sesion?.routineName}</p>
              <p
                className="font-mono text-[#FF6B7A] text-[22px] font-bold"
                style={{ textShadow: '0 0 18px rgba(230,57,70,0.45)' }}
              >
                {resumen?.durationMinutes != null ? `${resumen.durationMinutes} min` : formatElapsed(elapsed)}
              </p>
            </div>

            {/* Stats fila */}
            {resumen && (
              <div className="grid grid-cols-3 gap-2 px-6 pb-4 shrink-0">
                {[
                  { valor: resumen.numEjercicios, label: 'Ejercicios' },
                  { valor: resumen.totalSeries,   label: 'Series' },
                  { valor: resumen.totalReps,     label: 'Reps' },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl py-2.5 px-2 flex flex-col items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="font-['Oswald'] text-[20px] font-bold text-white leading-none">{stat.valor}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-white/40">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Desglose por ejercicio — scrollable */}
            {resumen?.ejerciciosResumen?.length > 0 && (
              <>
                <div className="shrink-0 mx-6 border-t border-white/[0.06]" />
                <div className="overflow-y-auto flex-1 px-6 py-2">
                  {resumen.ejerciciosResumen.map(ej => (
                    <div
                      key={ej.titulo}
                      className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-b-0"
                    >
                      <span
                        className="font-['Oswald'] text-sm font-semibold uppercase truncate flex-1"
                        style={{ color: ej.completado ? '#fff' : 'rgba(255,255,255,0.30)' }}
                      >
                        {ej.titulo}
                      </span>
                      <span className="font-mono text-xs text-white/45 shrink-0">
                        {ej.sets} × {ej.reps}
                        {ej.load !== null && (
                          <span style={{ color: '#FF6B7A' }}> · {ej.load} {ej.unit}</span>
                        )}
                      </span>
                      {ej.esPR && (
                        <span
                          className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(74,222,128,0.12)',
                            color: '#4ade80',
                            border: '1px solid rgba(74,222,128,0.30)',
                          }}
                        >
                          PR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Botones fijos */}
            <div className="shrink-0 p-6 pt-4 flex flex-col gap-3">
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
