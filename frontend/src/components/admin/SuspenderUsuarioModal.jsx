import { useState } from 'react'

export default function SuspenderUsuarioModal({ usuario, onConfirmar, onCancelar, cargando = false }) {
  const [motivo, setMotivo] = useState('')

  const handleConfirmar = () => {
    onConfirmar(motivo.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-md border border-orange-500/30 shadow-2xl shadow-orange-900/20">

        {/* Icono */}
        <div className="px-8 pt-8 pb-0">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          </div>

          {/* Título */}
          <h2 className="font-['Oswald'] text-2xl font-bold uppercase text-white mb-2 leading-tight">
            ¿Suspender a {usuario?.fullName}?
          </h2>
          <p className="text-white/40 text-sm mb-1">
            {usuario?.email} · <span className="font-medium">{usuario?.role}</span>
          </p>
          <p className="text-white/50 text-sm mb-5">
            El usuario no podrá iniciar sesión hasta que reactives la cuenta.
          </p>

          {/* Aviso reversible */}
          <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3 mb-6">
            <p className="text-orange-400 text-sm font-semibold mb-1">Esto es reversible</p>
            <p className="text-white/45 text-sm leading-relaxed">
              Puedes reactivar la cuenta desde la lista de suspendidos en cualquier momento.
            </p>
          </div>

          {/* Campo motivo */}
          <div className="mb-6">
            <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest block mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: spam reportado por 3 usuarios…"
              rows={3}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-sm placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 px-8 pb-7">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 py-3 rounded-xl bg-white/[0.07] text-white/70 font-bold text-sm hover:bg-white/[0.12] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={cargando}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-['Oswald'] font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 shadow-lg shadow-orange-900/30"
          >
            {cargando ? 'Suspendiendo…' : 'Suspender'}
          </button>
        </div>

      </div>
    </div>
  )
}
