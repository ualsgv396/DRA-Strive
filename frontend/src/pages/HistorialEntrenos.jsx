import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const ESTADO = {
  COMPLETED: { label: 'Completada', color: 'text-green-400' },
  ABANDONED: { label: 'Abandonada', color: 'text-white/40' },
  STARTED:   { label: 'En curso',   color: 'text-[#E63946]' },
}

const POR_PAGINA = 10

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistorialEntrenos() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(0)

  useEffect(() => {
    api.get('/training-sessions?limit=30')
      .then(r => setSesiones(r.data ?? []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setCargando(false))
  }, [])

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta sesión?')) return
    try {
      await api.delete(`/training-sessions/${id}`)
      setSesiones(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Error al eliminar la sesión')
    }
  }

  const totalPaginas = Math.ceil(sesiones.length / POR_PAGINA)
  const paginadas = sesiones.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-28">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-white/8 bg-[#111]">
        <span
          className="font-['Oswald'] text-2xl font-bold italic text-[#E63946] tracking-widest cursor-pointer"
          onClick={() => navigate('/panel')}
        >
          STRIVE
        </span>
        <button
          onClick={() => navigate('/panel')}
          className="text-white/50 border border-white/20 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors"
        >
          ← Panel
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-10">

        <h1 className="font-['Oswald'] text-4xl font-bold uppercase mb-2">Historial</h1>
        <p className="text-white/40 text-sm mb-8">Tus últimas 30 sesiones de entrenamiento</p>

        {error && (
          <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm mb-6">
            {error}
          </div>
        )}

        {cargando && (
          <p className="text-white/40 text-center py-20">Cargando historial...</p>
        )}

        {!cargando && sesiones.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-['Oswald'] text-2xl font-bold uppercase mb-2">Sin entrenamientos</p>
            <p className="text-white/40 text-sm mb-6">Inicia tu primer entrenamiento desde una rutina</p>
            <button
              onClick={() => navigate('/panel')}
              className="bg-[#E63946] text-white px-8 py-3 rounded-xl font-['Oswald'] font-bold uppercase tracking-wider hover:bg-[#C1121F] transition-colors"
            >
              Ir al panel
            </button>
          </div>
        )}

        {!cargando && sesiones.length > 0 && (
          <>
            {/* Tabla */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden mb-6">
              {/* Cabecera */}
              <div className="grid grid-cols-[1fr_1.5fr_80px_110px_100px] gap-4 px-5 py-3 border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                <span>Fecha</span>
                <span>Rutina</span>
                <span className="text-center">Duración</span>
                <span className="text-center">Estado</span>
                <span />
              </div>

              {paginadas.map(sesion => {
                const estado = ESTADO[sesion.status] ?? { label: sesion.status, color: 'text-white/40' }
                return (
                  <div
                    key={sesion.id}
                    className="grid grid-cols-[1fr_1.5fr_80px_110px_100px] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 items-center hover:bg-white/2 transition-colors"
                  >
                    <span className="text-white/60 text-sm">{formatFecha(sesion.startedAt)}</span>
                    <span className="font-['Oswald'] font-semibold uppercase truncate text-sm">
                      {sesion.routineName}
                    </span>
                    <span className="text-white/60 text-sm text-center">
                      {sesion.durationMinutes != null ? `${sesion.durationMinutes} min` : '—'}
                    </span>
                    <span className={`text-xs font-semibold text-center ${estado.color}`}>
                      {estado.label}
                    </span>
                    <div className="flex gap-2 justify-end">
                      {sesion.status === 'STARTED' && (
                        <button
                          onClick={() => navigate(`/entrenamiento/${sesion.id}`)}
                          className="text-xs text-[#E63946] border border-[#E63946]/40 px-2 py-1 rounded hover:bg-[#E63946]/10 transition-colors"
                        >
                          Continuar
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(sesion.id)}
                        className="text-xs text-white/30 border border-white/10 px-2 py-1 rounded hover:text-[#E63946] hover:border-[#E63946]/40 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="border border-white/20 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-white/40 text-sm">
                  {pagina + 1} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina === totalPaginas - 1}
                  className="border border-white/20 text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
