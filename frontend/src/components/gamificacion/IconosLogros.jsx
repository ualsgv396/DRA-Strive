/* ════════════════════════════════════════════════════════════════════════
   IconosLogros.jsx
   Ubicación destino:  src/components/gamificacion/IconosLogros.jsx
   ────────────────────────────────────────────────────────────────────────
   Set de iconos lineales premium para la gamificación de STRIVE.
   Reemplaza por completo los emojis. Trazo limpio 24×24, sin relleno.
   Exporta:  Iconos · BADGE_ICON · BadgeIcon
   ════════════════════════════════════════════════════════════════════════ */

const RED      = '#E63946'
const RED_SOFT = '#FF6B7A'

function SVG({ children, sw = 1.7, ...p }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      {children}
    </svg>
  )
}

export const Iconos = {
  // Primera Gota — gota de agua
  droplet: (p) => (
    <SVG {...p}><path d="M12 2.8c2.7 3.2 6 6.9 6 10.4a6 6 0 0 1-12 0c0-3.5 3.3-7.2 6-10.4Z" /></SVG>
  ),
  // En Racha — llama moderna
  flame: (p) => (
    <SVG {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2 2.5Z" /></SVG>
  ),
  // Constante — fuerza / mancuerna
  dumbbell: (p) => (
    <SVG sw={1.8} {...p}>
      <path d="M6.5 8v8M3.5 9.8v4.4M17.5 8v8M20.5 9.8v4.4M6.5 12h11" />
    </SVG>
  ),
  // Dedicado — rayo
  zap: (p) => (
    <SVG {...p}><path d="M13 2 4.6 12.5a.6.6 0 0 0 .5 1H11l-1 8.5 8.4-10.5a.6.6 0 0 0-.5-1H12l1-8.5Z" /></SVG>
  ),
  // Élite — corona
  crown: (p) => (
    <SVG {...p}>
      <path d="M3 7.5l3.4 3a.8.8 0 0 0 1.2-.2L11.3 4a.8.8 0 0 1 1.4 0l3.7 6.3a.8.8 0 0 0 1.2.2l3.4-3-2.2 10.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8L3 7.5Z" />
      <path d="M6 21h12" />
    </SVG>
  ),
  // Trío de Fuego — racha 3 días (calendario + check)
  cal3: (p) => (
    <SVG {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 9.3h17M8 3v3.4M16 3v3.4" />
      <path d="m9 14.5 1.8 1.8L14.5 12" />
    </SVG>
  ),
  // Semana Perfecta — semana completa
  cal7: (p) => (
    <SVG {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 9.3h17M8 3v3.4M16 3v3.4" />
      <path d="M7 13h2M11 13h2M15 13h2M7 16.7h2M11 16.7h2" />
    </SVG>
  ),
  // Máquina del Mes — mes (calendario + infinito)
  cal30: (p) => (
    <SVG {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 9.3h17M8 3v3.4M16 3v3.4" />
      <path d="M8.6 16.2c0-.9.7-1.6 1.5-1.6s1.4.7 1.9 1.6c.5.9 1.1 1.6 1.9 1.6s1.5-.7 1.5-1.6-.7-1.6-1.5-1.6-1.4.7-1.9 1.6c-.5.9-1.1 1.6-1.9 1.6s-1.5-.7-1.5-1.6Z" />
    </SVG>
  ),
  // Arquitecto — portapapeles / plano
  blueprint: (p) => (
    <SVG {...p}>
      <path d="M9 4.5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="3.4" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </SVG>
  ),
  // Coleccionista — capas
  layers: (p) => (
    <SVG {...p}>
      <path d="m12 3 8.2 4.4a.5.5 0 0 1 0 .9L12 12.7 3.8 8.3a.5.5 0 0 1 0-.9L12 3Z" />
      <path d="m4 12 8 4.3 8-4.3" />
      <path d="m4 16 8 4.3 8-4.3" />
    </SVG>
  ),
  // No Entreno Solo — apretón de manos
  handshake: (p) => (
    <SVG {...p}>
      <path d="m11.5 17 1.8 1.8a1 1 0 0 0 1.4-1.4" />
      <path d="m13.8 14.3 2.3 2.3a1 1 0 0 0 1.4-1.4l-3.5-3.5a2.6 2.6 0 0 0-3.7 0l-.8.8a1 1 0 0 1-1.4-1.4l2.5-2.5a5 5 0 0 1 6.1-.7l.4.2a1.7 1.7 0 0 0 1.2.2L21 7.5" />
      <path d="m21 6 .8 9h-1.6" />
      <path d="M3 6 2.2 15l5.7 5.7a1 1 0 0 0 1.4-1.4" />
      <path d="M3 6.8h7" />
    </SVG>
  ),
  // Generoso — regalo
  gift: (p) => (
    <SVG {...p}>
      <path d="M19.5 11.5V20a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8.5" />
      <rect x="2.8" y="7.5" width="18.4" height="4" rx="1" />
      <path d="M12 7.5V21" />
      <path d="M12 7.5H7.8a2.1 2.1 0 0 1 0-4.2C10.8 3.3 12 7.5 12 7.5Z" />
      <path d="M12 7.5h4.2a2.1 2.1 0 0 0 0-4.2C13.2 3.3 12 7.5 12 7.5Z" />
    </SVG>
  ),

  // ── utilitarios ──
  trophy: (p) => (
    <SVG {...p}>
      <path d="M7 4.5h10v5a5 5 0 0 1-10 0v-5Z" />
      <path d="M7 6.5H5a2 2 0 0 0 0 4h2M17 6.5h2a2 2 0 0 1 0 4h-2" />
      <path d="M12 14.5V18M8.5 21h7M9.5 21c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5" />
    </SVG>
  ),
  lock: (p) => (
    <SVG sw={1.9} {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </SVG>
  ),
  check: (p) => (
    <SVG sw={2.4} {...p}><path d="m5 12.5 4.5 4.5L19 7" /></SVG>
  ),
  arrow: (p) => (
    <SVG sw={1.8} {...p}><path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" /></SVG>
  ),
}

/* mapa  tipo-de-logro → icono */
export const BADGE_ICON = {
  FIRST_SESSION: 'droplet',
  SESSIONS_5:    'flame',
  SESSIONS_10:   'dumbbell',
  SESSIONS_25:   'zap',
  SESSIONS_50:   'crown',
  STREAK_3:      'cal3',
  STREAK_7:      'cal7',
  STREAK_30:     'cal30',
  FIRST_ROUTINE: 'blueprint',
  ROUTINES_5:    'layers',
  FIRST_FRIEND:  'handshake',
  FIRST_SHARE:   'gift',
}

/* ── BadgeIcon — medallón con estado bloqueado / desbloqueado ───────────── */
export function BadgeIcon({ tipo, size = 30, unlocked, lock = false }) {
  const nombre = BADGE_ICON[tipo] || 'trophy'
  const Glyph  = Iconos[nombre]
  const box    = Math.round(size * 1.9)
  const radius = Math.round(box * 0.30)

  return (
    <div style={{ position: 'relative', width: box, height: box, flexShrink: 0 }}>
      {unlocked && (
        <span style={{
          position: 'absolute', inset: '14%',
          borderRadius: radius,
          background: 'radial-gradient(circle at 50% 45%, rgba(230,57,70,0.45), transparent 70%)',
          filter: 'blur(7px)',
        }} />
      )}
      <div style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: radius,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: unlocked
          ? 'linear-gradient(160deg, rgba(230,57,70,0.16), rgba(230,57,70,0.05))'
          : 'rgba(255,255,255,0.025)',
        boxShadow: unlocked
          ? 'inset 0 0 0 1px rgba(230,57,70,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        color: unlocked ? RED_SOFT : 'rgba(255,255,255,0.20)',
      }}>
        <Glyph width={size} height={size} />
      </div>

      {!unlocked && lock && (
        <span style={{
          position: 'absolute', right: -3, bottom: -3,
          width: Math.round(box * 0.34), height: Math.round(box * 0.34),
          borderRadius: '50%',
          background: '#161616',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.32)',
        }}>
          <Iconos.lock width={Math.round(box * 0.18)} height={Math.round(box * 0.18)} />
        </span>
      )}
    </div>
  )
}

export const COLOR_RED = RED
export const COLOR_RED_SOFT = RED_SOFT
