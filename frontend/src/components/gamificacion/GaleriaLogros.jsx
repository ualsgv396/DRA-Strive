import { BADGE_META } from '../../hooks/useGamification'

const ORDEN = [
  'FIRST_SESSION', 'SESSIONS_5', 'SESSIONS_10', 'SESSIONS_25', 'SESSIONS_50',
  'STREAK_3', 'STREAK_7', 'STREAK_30',
  'FIRST_ROUTINE', 'ROUTINES_5',
  'FIRST_FRIEND', 'FIRST_SHARE',
]

export default function GaleriaLogros({ logros = [] }) {
  const desbloqueados = new Set(logros.map(l => l.tipo))

  return (
    <section style={s.seccion}>
      <div style={s.header}>
        <span style={s.icono}>🏆</span>
        <h2 style={s.titulo}>Logros</h2>
        <span style={s.contador}>{desbloqueados.size} / {ORDEN.length}</span>
        <span style={s.rule} />
      </div>

      <div style={s.grid}>
        {ORDEN.map(tipo => {
          const meta        = BADGE_META[tipo]
          const desbloqueado = desbloqueados.has(tipo)
          const badge        = logros.find(l => l.tipo === tipo)

          return (
            <div
              key={tipo}
              title={desbloqueado ? `${meta.nombre} — ${meta.desc}` : `Bloqueado: ${meta.desc}`}
              style={{
                ...s.badge,
                ...(desbloqueado ? s.badgeOn : s.badgeOff),
              }}
            >
              <span style={{ fontSize: 26, filter: desbloqueado ? 'none' : 'grayscale(1) opacity(0.25)' }}>
                {meta.icono}
              </span>
              <p style={{ ...s.badgeNombre, color: desbloqueado ? '#fff' : 'rgba(255,255,255,0.22)' }}>
                {meta.nombre}
              </p>
              {desbloqueado && badge && (
                <p style={s.badgeFecha}>
                  {new Date(badge.desbloqueadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
              )}
              {!desbloqueado && <p style={s.badgeFecha}>???</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const RED = '#E63946'

const s = {
  seccion: { marginBottom: 32 },
  header: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  icono: { fontSize: 14 },
  titulo: {
    fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.55)', margin: 0,
  },
  contador: {
    fontFamily: "'Oswald', sans-serif", fontSize: 12, fontWeight: 600,
    color: RED, background: 'rgba(230,57,70,0.12)',
    border: '1px solid rgba(230,57,70,0.28)',
    borderRadius: 999, padding: '2px 8px',
  },
  rule: { flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 10,
  },
  badge: {
    borderRadius: 14, padding: '14px 10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    cursor: 'default', transition: 'transform .15s',
  },
  badgeOn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  badgeOff: {
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  badgeNombre: {
    fontFamily: "'Inter', sans-serif", fontWeight: 600,
    fontSize: 11, textAlign: 'center', margin: 0, lineHeight: 1.3,
  },
  badgeFecha: {
    fontFamily: "'Inter', sans-serif", fontSize: 10,
    color: 'rgba(255,255,255,0.30)', margin: 0,
  },
}
