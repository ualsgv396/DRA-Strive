import api from '../../api/axios'

const RED  = '#E63946'
const EMOJIS = ['💪', '🔥', '👏', '🤙']

// Color de avatar determinista igual que en VentanaChat / Amigos
const HUES = [354, 18, 168, 262, 210, 38]
function hueDe(txt = '') {
  let h = 0
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) % 360
  return HUES[h % HUES.length]
}

function Avatar({ nombre = '?', size = 40 }) {
  const hue     = hueDe(nombre)
  const inicial = (nombre.trim()[0] || '?').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: size * 0.42,
      color: `oklch(0.92 0.09 ${hue})`,
      background: `oklch(0.30 0.07 ${hue} / 0.55)`,
      boxShadow: `inset 0 0 0 1.5px oklch(0.65 0.13 ${hue} / 0.6)`,
    }}>
      {inicial}
    </div>
  )
}

function tiempoHace(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'ahora mismo'
  if (min < 60)  return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)    return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7)     return `hace ${d} d`
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

/**
 * Tarjeta de feed individual.
 *
 * item       — FeedItemDto del backend
 * onReaccion — callback(sessionId, emoji, updatedReacciones)
 */
export default function FeedItem({ item, onReaccion }) {
  const handleEmoji = async (emoji) => {
    // Optimistic: notificar al padre antes de la respuesta del servidor
    const reaccionesOpt = toggleOptimista(item.reacciones, emoji)
    onReaccion(item.sessionId, emoji, reaccionesOpt)

    try {
      const { data } = await api.post(`/feed/${item.sessionId}/reaction`, { emoji })
      // Reconciliar con la respuesta real
      onReaccion(item.sessionId, emoji, data)
    } catch {
      // En caso de error, revertir al estado previo
      onReaccion(item.sessionId, emoji, item.reacciones)
    }
  }

  return (
    <article style={s.card}>
      {/* Cabecera: avatar + nombre + tiempo */}
      <div style={s.header}>
        <Avatar nombre={item.friendFullName} size={40} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={s.nombre}>{item.friendFullName}</p>
          <p style={s.nick}>@{item.friendNickname} · {tiempoHace(item.completedAt)}</p>
        </div>
      </div>

      {/* Cuerpo: rutina + stats */}
      <div style={s.cuerpo}>
        <div style={s.rutinaRow}>
          <span style={s.iconoDumbbell}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>
            </svg>
          </span>
          <span style={s.rutinaNombre}>{item.routineName}</span>
        </div>

        <div style={s.stats}>
          {item.durationMinutes != null && (
            <span style={s.stat}>⏱ {item.durationMinutes} min</span>
          )}
          {item.numEjercicios > 0 && (
            <span style={s.stat}>🏋️ {item.numEjercicios} ejercicios</span>
          )}
        </div>
      </div>

      {/* Reacciones */}
      <div style={s.reaccionesRow}>
        {EMOJIS.map(emoji => {
          const r   = item.reacciones?.find(r => r.emoji === emoji)
          const mia = r?.mia ?? false
          return (
            <button
              key={emoji}
              onClick={() => handleEmoji(emoji)}
              style={{
                ...s.emojiBtn,
                background:   mia ? 'rgba(230,57,70,0.18)' : 'rgba(255,255,255,0.04)',
                borderColor:  mia ? 'rgba(230,57,70,0.5)'  : 'rgba(255,255,255,0.08)',
                color:        mia ? '#fff'                 : 'rgba(255,255,255,0.55)',
                transform:    'none',
              }}
            >
              {emoji}
              {r && r.count > 0 && (
                <span style={{ ...s.emojiCount, color: mia ? RED : 'rgba(255,255,255,0.4)' }}>
                  {r.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </article>
  )
}

// Lógica optimista: toggle local sin esperar al servidor
function toggleOptimista(reacciones = [], emoji) {
  const idx = reacciones.findIndex(r => r.emoji === emoji)
  if (idx === -1) {
    return [...reacciones, { emoji, count: 1, mia: true }]
  }
  const r = reacciones[idx]
  if (r.mia) {
    const newCount = r.count - 1
    if (newCount <= 0) return reacciones.filter((_, i) => i !== idx)
    return reacciones.map((r, i) => i === idx ? { ...r, count: newCount, mia: false } : r)
  }
  return reacciones.map((r, i) => i === idx ? { ...r, count: r.count + 1, mia: true } : r)
}

const s = {
  card: {
    background: '#131313',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  header: { display: 'flex', alignItems: 'center', gap: 12 },
  nombre: {
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15,
    color: '#fff', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  nick: {
    fontFamily: "'Inter', sans-serif", fontSize: 12,
    color: 'rgba(255,255,255,0.38)', margin: '2px 0 0',
  },
  cuerpo: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  rutinaRow: { display: 'flex', alignItems: 'center', gap: 8 },
  iconoDumbbell: { flexShrink: 0 },
  rutinaNombre: {
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: 17, textTransform: 'uppercase', color: '#fff',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  stats: { display: 'flex', gap: 14 },
  stat: {
    fontFamily: "'Inter', sans-serif", fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  reaccionesRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  emojiBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    border: '1px solid', borderRadius: 999,
    padding: '5px 11px', fontSize: 16, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", transition: 'background .12s, border-color .12s',
  },
  emojiCount: {
    fontSize: 12, fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  },
}
