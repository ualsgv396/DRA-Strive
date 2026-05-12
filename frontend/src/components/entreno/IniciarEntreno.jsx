import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function IniciarEntreno({ routineId, routineName, onCancel }) {
  const navigate = useNavigate()
  const [notas, setNotas] = useState('')
  const [iniciando, setIniciando] = useState(false)
  const [error, setError] = useState('')

  const iniciar = async () => {
    setIniciando(true)
    setError('')
    try {
      const { data } = await api.post('/training-sessions', {
        routineId,
        notes: notas || null,
      })
      navigate(`/entrenamiento/${data.id}`)
    } catch (err) {
      if (err.isForbidden) {
        setError('No tienes permiso para iniciar esta rutina')
      } else {
        setError('Error al iniciar el entrenamiento')
      }
      setIniciando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full border border-white/10">
        <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-1">Iniciar entreno</h3>
        <p className="text-white/50 text-sm mb-6 truncate">{routineName}</p>

        <div className="mb-4">
          <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">
            Notas del día (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Ej: buen día, descansado, nueva marca..."
            rows={3}
            maxLength={500}
            className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#E63946] transition-colors resize-none"
          />
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
            onClick={iniciar}
            disabled={iniciando}
            className="flex-1 bg-[#E63946] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#C1121F] transition-colors disabled:opacity-70"
          >
            {iniciando ? 'Iniciando...' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  )
}
