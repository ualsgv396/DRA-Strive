export default function TarjetaRutina({ rutina, onClick }) {
  const numEjercicios = rutina.routineExercises?.length || 0
  const fecha = new Date(rutina.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

  return (
    <div className="card-press" style={s.tarjeta} onClick={onClick}>
      <span style={s.tarjetaInsetGlow} />
      <div style={s.tarjetaContenido}>
        <div style={s.tarjetaCabecera}>
          <div>
            <span style={s.eyebrowSmall}>Rutina</span>
            <h3 style={s.tarjetaTitulo}>{rutina.name}</h3>
            <p style={s.tarjetaDescripcion}>{rutina.goal || 'Sin descripción'}</p>
          </div>
          <span style={s.tarjetaArrow} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
        <div style={s.tarjetaStats}>
          <Stat label="Ejercicios" value={String(numEjercicios).padStart(2, '0')} />
          <Stat label="Creada" value={fecha} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

const s = {
  tarjeta: {
    position: 'relative',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 50%), #141414',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)',
  },
  tarjetaInsetGlow: {
    position: 'absolute', top: 14, bottom: 14, left: 0, width: 3,
    borderRadius: '0 3px 3px 0',
    background: 'linear-gradient(180deg, transparent, #E63946 30%, #E63946 70%, transparent)',
    boxShadow: '0 0 18px rgba(230,57,70,0.55)',
  },
  tarjetaContenido: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tarjetaCabecera: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  },
  eyebrowSmall: {
    display: 'inline-block',
    fontFamily: "'Inter', sans-serif",
    fontSize: '9px', fontWeight: 600,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(230,57,70,0.10)',
    color: '#FF6B7A',
    border: '1px solid rgba(230,57,70,0.30)',
    marginBottom: '8px',
  },
  tarjetaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '22px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 4px',
  },
  tarjetaDescripcion: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
    margin: 0,
  },
  tarjetaArrow: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.72)',
    flexShrink: 0,
  },
  tarjetaStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  statValue: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '20px',
    lineHeight: 1,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    marginTop: 4,
    fontSize: '9px',
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
  },
}
