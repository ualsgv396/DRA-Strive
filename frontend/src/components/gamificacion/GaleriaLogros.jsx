/* ════════════════════════════════════════════════════════════════════════
   GaleriaLogros.jsx   (Tarea 1 — sección de navegación del Panel)
   Ubicación destino:  src/components/gamificacion/GaleriaLogros.jsx
   ────────────────────────────────────────────────────────────────────────
   Reemplaza la antigua cuadrícula de 12 logros por una tarjeta de navegación
   compacta y premium. Es un CTA de ancho completo que abre /logros.

   ▸ EN Panel.jsx:  elimina el <div> con el botón "Ver todos →" que envolvía
     a <GaleriaLogros/> y déjalo así:

         {gamificacion && <GaleriaLogros logros={gamificacion.logros} />}

     (este componente ya navega solo a /logros).
   ════════════════════════════════════════════════════════════════════════ */

import { useNavigate } from 'react-router-dom'
import { Iconos, BadgeIcon, COLOR_RED, COLOR_RED_SOFT } from './IconosLogros'

const RED      = COLOR_RED
const RED_SOFT = COLOR_RED_SOFT

const ORDEN = [
  'FIRST_SESSION', 'SESSIONS_5', 'SESSIONS_10', 'SESSIONS_25', 'SESSIONS_50',
  'STREAK_3', 'STREAK_7', 'STREAK_30',
  'FIRST_ROUTINE', 'ROUTINES_5',
  'FIRST_FRIEND', 'FIRST_SHARE',
]

export default function GaleriaLogros({ logros = [] }) {
  const navigate = useNavigate()

  const conseguidos = new Set(logros.map(l => l.tipo)).size
  const total       = ORDEN.length
  const pct         = Math.round((conseguidos / total) * 100)

  const recientes = [...logros]
    .sort((a, b) => new Date(b.desbloqueadoEn) - new Date(a.desbloqueadoEn))
    .slice(0, 4)
    .map(l => l.tipo)

  return (
    <section style={{ marginBottom: 32 }}>
      <style>{`
        .tl-card { transition: transform 140ms cubic-bezier(.2,.7,.2,1), box-shadow 140ms; }
        .tl-card:hover { transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05); }
        .tl-card:hover .tl-arrow { transform: translateX(4px); color:#fff; background:rgba(230,57,70,0.16); }
        .tl-card:active { transform: translateY(0); }
        @media (max-width: 640px) { .tl-card { flex-direction: column !important; align-items: stretch !important; } .tl-foot { padding-top:16px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); justify-content:space-between !important; } }
      `}</style>

      <button type="button" className="tl-card" onClick={() => navigate('/logros')}
        style={{
          position: 'relative', width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 22,
          padding: '22px 26px', borderRadius: 18, border: 'none',
          background: 'linear-gradient(180deg, #1B1B1B 0%, #161616 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden', fontFamily: "'Inter', sans-serif",
        }}>

        <span style={{
          position: 'absolute', top: -60, left: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(230,57,70,0.12), transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* trofeo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{
            position: 'absolute', inset: '-12%',
            background: 'radial-gradient(circle at 50% 42%, rgba(230,57,70,0.40), transparent 70%)',
            filter: 'blur(10px)',
          }} />
          <div style={{
            position: 'relative', width: 64, height: 64, borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, rgba(230,57,70,0.22), rgba(230,57,70,0.05))',
            boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
            color: RED_SOFT,
          }}>
            <Iconos.trophy width={34} height={34} />
          </div>
        </div>

        {/* contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h3 style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 18,
              letterSpacing: '2px', textTransform: 'uppercase', color: '#fff',
              margin: 0, whiteSpace: 'nowrap',
            }}>Mis Logros</h3>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 11,
              letterSpacing: '0.5px', color: RED_SOFT, whiteSpace: 'nowrap',
              background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.28)',
              borderRadius: 999, padding: '2px 9px',
            }}>{conseguidos} / {total}</span>
          </div>

          <p style={{
            fontSize: 12.5, color: 'rgba(255,255,255,0.42)',
            margin: '0 0 12px', lineHeight: 1.5, maxWidth: 420,
          }}>Descubre tus hitos y desafíos. Ver progreso detallado…</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 99,
                background: `linear-gradient(90deg, ${RED}, ${RED_SOFT})`,
                boxShadow: '0 0 10px rgba(230,57,70,0.5)',
              }} />
            </div>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{pct}%</span>
          </div>
        </div>

        {/* destacados + flecha */}
        <div className="tl-foot" style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {recientes.map((tipo, i) => (
              <div key={tipo} style={{
                marginLeft: i === 0 ? 0 : -10, borderRadius: 14, background: '#161616',
                boxShadow: '0 0 0 3px #181818', position: 'relative', zIndex: recientes.length - i,
              }}>
                <BadgeIcon tipo={tipo} size={18} unlocked />
              </div>
            ))}
          </div>

          <span className="tl-arrow" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'transform 160ms cubic-bezier(.2,.7,.2,1), color 160ms, background 160ms',
          }}>
            <Iconos.arrow width={22} height={22} />
          </span>
        </div>
      </button>
    </section>
  )
}
