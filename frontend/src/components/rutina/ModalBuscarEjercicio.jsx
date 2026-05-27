import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'

export default function ModalBuscarEjercicio({ rutinaId, onAnadido, onCerrar }) {
  const [ejercicios, setEjercicios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [loadValue, setLoadValue] = useState('')
  const [loadUnit, setLoadUnit] = useState('KG')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/exercises')
      .then(r => setEjercicios(r.data ?? []))
      .catch(() => setError('No se pudieron cargar los ejercicios'))
      .finally(() => setCargando(false))
  }, [])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = q
      ? ejercicios.filter(e => e.title?.toLowerCase().includes(q))
      : ejercicios
    return lista.slice(0, 40)
  }, [ejercicios, busqueda])

  const handleAnadir = async () => {
    setGuardando(true)
    setError('')
    try {
      const { data } = await api.post(`/routines/${rutinaId}/exercises`, {
        exerciseId: seleccionado.id,
        sets,
        reps,
        loadValue: loadValue === '' ? null : Number.parseFloat(loadValue),
        loadUnit,
      })
      onAnadido(data)
    } catch {
      setError('Error al añadir el ejercicio')
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={onCerrar}
    >
      <div
        className="bg-[#1A1A1A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg border border-white/10 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <h3 className="font-['Oswald'] text-xl font-bold uppercase tracking-wide">
            {seleccionado ? 'Configurar ejercicio' : 'Añadir ejercicio'}
          </h3>
          <button onClick={onCerrar} className="text-white/40 hover:text-white text-xl leading-none">✕</button>
        </div>

        {!seleccionado ? (
          <>
            {/* Búsqueda */}
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <input
                autoFocus
                type="search"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E63946] transition-colors"
              />
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {cargando && (
                <p className="text-white/40 text-sm text-center py-10">Cargando ejercicios...</p>
              )}
              {error && (
                <p className="text-[#E63946] text-sm text-center py-10">{error}</p>
              )}
              {!cargando && !error && filtrados.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSeleccionado(e)}
                  className="w-full flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#222] flex items-center justify-center">
                    {e.imageUrl
                      ? <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover" />
                      : <span className="text-lg opacity-60">💪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Oswald'] text-sm font-semibold uppercase truncate leading-tight">
                      {e.title}
                    </p>
                    <p className="text-white/35 text-[11px] mt-0.5">{e.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Paso 2: configurar sets/reps/carga */
          <div className="p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#222] flex items-center justify-center">
                {seleccionado.imageUrl
                  ? <img src={seleccionado.imageUrl} alt={seleccionado.title} className="w-full h-full object-cover" />
                  : <span className="text-xl opacity-60">💪</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Oswald'] font-bold uppercase truncate">{seleccionado.title}</p>
                <button
                  onClick={() => { setSeleccionado(null); setError('') }}
                  className="text-white/40 text-xs hover:text-white transition-colors"
                >
                  ← Cambiar ejercicio
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">Series</label>
                <input
                  type="number" min="1" max="20" value={sets}
                  onChange={e => setSets(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2.5 text-white text-center text-xl font-bold outline-none focus:border-[#E63946] transition-colors"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">
                  {seleccionado.type === 'CARDIO' ? 'Intervalos' : 'Reps'}
                </label>
                <input
                  type="number" min="1" max="999" value={reps}
                  onChange={e => setReps(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2.5 text-white text-center text-xl font-bold outline-none focus:border-[#E63946] transition-colors"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">
                  {seleccionado.type === 'CARDIO' ? 'Duración' : 'Carga'}
                </label>
                <input
                  type="number" min="0" step="0.5" value={loadValue} placeholder="—"
                  onChange={e => setLoadValue(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 rounded-lg px-3 py-2.5 text-white text-center text-xl font-bold outline-none focus:border-[#E63946] transition-colors"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">Unidad</label>
                <select
                  value={loadUnit}
                  onChange={e => setLoadUnit(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 rounded-lg px-2 py-2.5 text-white text-sm outline-none focus:border-[#E63946] transition-colors"
                >
                  <option value="KG">kg</option>
                  <option value="REPS">Peso corporal</option>
                  <option value="SECONDS">Segundos</option>
                  <option value="MINUTES">Minutos</option>
                </select>
              </div>
            </div>

            {error && <p className="text-[#E63946] text-sm">{error}</p>}

            <button
              onClick={handleAnadir}
              disabled={guardando}
              className="w-full py-4 rounded-xl font-['Oswald'] font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-70"
              style={{
                background: 'linear-gradient(180deg, #EB4451 0%, #D52E3B 100%)',
                color: '#fff',
                border: '1px solid rgba(230,57,70,0.85)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 22px rgba(230,57,70,0.32)',
              }}
            >
              {guardando ? 'Añadiendo...' : '+ Añadir a la rutina'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
