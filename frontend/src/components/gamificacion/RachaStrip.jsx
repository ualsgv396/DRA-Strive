const RED = '#E63946'

export default function RachaStrip({ rachaActual = 0, rachaMasLarga = 0, ultimoEntreno = null }) {
  const hoy       = new Date().toISOString().split('T')[0]
  const entrenado = ultimoEntreno === hoy

  return (
    <div style={s.wrap}>
      <div style={s.llama}>
        <span style={{ fontSize: 22, filter: rachaActual > 0 ? 'none' : 'grayscale(1) opacity(0.4)' }}>
          🔥
        </span>
        <div>
          <span style={{ ...s.num, color: rachaActual > 0 ? RED : 'rgba(255,255,255,0.28)' }}>
            {rachaActual}
          </span>
          <span style={s.label}>
            {rachaActual === 1 ? 'día seguido' : 'días seguidos'}
          </span>
        </div>
      </div>

      <div style={s.sep} />

      <div style={s.meta}>
        <span style={s.metaLabel}>Récord</span>
        <span style={s.metaVal}>{rachaMasLarga}d</span>
      </div>

      <div style={{ ...s.dot, background: entrenado ? '#22C55E' : 'rgba(255,255,255,0.15)' }}>
        <span style={{ fontSize: 10 }}>{entrenado ? '✓ hoy' : 'hoy'}</span>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '10px 16px', marginBottom: 20,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  llama: { display: 'flex', alignItems: 'center', gap: 10 },
  num: {
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: 22, lineHeight: 1, display: 'block',
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2,
  },
  sep: { width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 },
  meta: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
  metaVal: {
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: 15, color: 'rgba(255,255,255,0.72)',
  },
  dot: {
    marginLeft: 'auto', borderRadius: 999,
    padding: '4px 10px',
    fontFamily: "'Inter', sans-serif", fontWeight: 600,
    fontSize: 11, color: '#fff',
  },
}
