import { useEffect, useState } from 'react'
import { BADGE_META } from '../../hooks/useGamification'

/**
 * Muestra una cola de toasts cuando se desbloquean logros nuevos.
 *
 * Props:
 *   badges  — array de { tipo, desbloqueadoEn } (newBadges de la API)
 *   onDone  — callback cuando todos los toasts se han cerrado
 */
export default function ToastLogro({ badges = [], onDone }) {
  const [cola, setCola]         = useState([])
  const [actual, setActual]     = useState(null)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    if (badges.length > 0) setCola(badges)
  }, [badges])

  useEffect(() => {
    if (!actual && cola.length > 0) {
      const [primero, ...resto] = cola
      setCola(resto)
      setActual(primero)
      setVisible(true)

      // Ocultar tras 3 s
      const t1 = setTimeout(() => setVisible(false), 3000)
      // Limpiar tras la animación de salida (0.3 s)
      const t2 = setTimeout(() => {
        setActual(null)
        if (resto.length === 0) onDone?.()
      }, 3300)

      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [actual, cola, onDone])

  if (!actual) return null

  const meta = BADGE_META[actual.tipo] ?? { icono: '🏅', nombre: actual.tipo }

  return (
    <>
      <style>{`
        @keyframes slideInToast { from { transform: translateY(120%) opacity: 0 } to { transform: translateY(0) opacity: 1 } }
        @keyframes slideOutToast { from { transform: translateY(0) opacity: 1 } to { transform: translateY(120%) opacity: 0 } }
      `}</style>
      <div style={{
        ...s.toast,
        animation: `${visible ? 'slideInToast' : 'slideOutToast'} .3s ease both`,
      }}>
        <span style={s.icono}>{meta.icono}</span>
        <div style={s.texto}>
          <p style={s.titulo}>¡Logro desbloqueado!</p>
          <p style={s.nombre}>{meta.nombre}</p>
        </div>
      </div>
    </>
  )
}

const s = {
  toast: {
    position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)', left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #1a1a1a, #111)',
    border: '1px solid rgba(230,57,70,0.45)',
    borderRadius: 16, padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(230,57,70,0.12) inset',
    zIndex: 900, minWidth: 240, maxWidth: '90vw',
  },
  icono: { fontSize: 32, flexShrink: 0 },
  texto: { minWidth: 0 },
  titulo: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    color: '#E63946', margin: 0,
  },
  nombre: {
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: 17, color: '#fff', margin: '2px 0 0', textTransform: 'uppercase',
  },
}
