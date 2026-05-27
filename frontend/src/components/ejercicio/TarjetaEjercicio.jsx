export default function TarjetaEjercicio({ ejercicio, onVerDetalles, esFavorito, onToggleFavorito }) {
  const tone = toneFromType(ejercicio.type)

  return (
    <div
      style={s.tarjeta}
      className="card-press"
      onMouseEnter={e => { e.currentTarget.style.borderColor = tone.border }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
    >
      {/* Foto-héroe */}
      <div style={s.imagenContenedor}>
        {ejercicio.imageUrl ? (
          <img
            src={ejercicio.imageUrl}
            alt={ejercicio.title}
            style={s.imagen}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div style={{ ...s.imagenPlaceholder, display: ejercicio.imageUrl ? 'none' : 'flex' }}>
          <span style={{ fontSize: '40px', opacity: 0.55 }}>💪</span>
        </div>

        {/* Overlay gradient sobre la foto */}
        <div style={s.imagenOverlay} />

        {/* Type chip flotante (overlay con blur) */}
        <span style={{ ...s.tipoBadgeOverlay, color: tone.text, borderColor: tone.border }}>
          <span style={{ ...s.tipoDot, background: tone.dot, boxShadow: `0 0 8px ${tone.dot}` }} />
          {ejercicio.type ?? 'General'}
        </span>

        {/* Botón favorito */}
        {onToggleFavorito ? (
          <button
            style={{ ...s.arrowChip, ...(esFavorito ? s.favActivo : {}) }}
            onClick={e => { e.stopPropagation(); onToggleFavorito(ejercicio.id) }}
            aria-label={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
                 fill={esFavorito ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        ) : (
          <span style={s.arrowChip} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </span>
        )}
      </div>

      {/* Contenido */}
      <div style={s.contenido}>
        <h3 style={s.titulo}>{ejercicio.title}</h3>

        {ejercicio.difficulty && (
          <span style={{ ...s.dificultadBadge, ...difficultyStyle(ejercicio.difficulty) }}>
            {ejercicio.difficulty}
          </span>
        )}

        {(ejercicio.muscleGroups ?? []).length > 0 && (
          <div style={s.grupos}>
            {ejercicio.muscleGroups.map(g => (
              <span key={g} style={s.grupoBadge}>{g}</span>
            ))}
          </div>
        )}

        {ejercicio.description && (
          <p style={s.descripcion}>{ejercicio.description}</p>
        )}

        {onVerDetalles && (
          <button
            style={s.botonVerDetalles}
            onClick={() => onVerDetalles(ejercicio)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
          >
            Ver detalles
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function difficultyStyle(level) {
  switch (level) {
    case 'PRINCIPIANTE': return { color: '#4ADE80', borderColor: 'rgba(74,222,128,0.35)',  background: 'rgba(74,222,128,0.08)'  }
    case 'INTERMEDIO':   return { color: '#FBB740', borderColor: 'rgba(251,183,64,0.35)',  background: 'rgba(251,183,64,0.08)'  }
    case 'AVANZADO':     return { color: '#FF6B7A', borderColor: 'rgba(230,57,70,0.35)',   background: 'rgba(230,57,70,0.08)'   }
    default:             return { color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }
  }
}

function toneFromType(type) {
  switch (type) {
    case 'CARDIO':    return { text: '#FFB37A', dot: '#FF8C42', border: 'rgba(255,140,66,0.35)' }
    case 'FUERZA':    return { text: '#FF6B7A', dot: '#E63946', border: 'rgba(230,57,70,0.35)' }
    case 'MOVILIDAD': return { text: '#7FE3DC', dot: '#4ECDC4', border: 'rgba(78,205,196,0.35)' }
    default:          return { text: 'rgba(255,255,255,0.7)', dot: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.18)' }
  }
}

const s = {
  tarjeta: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)) , #141414',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  imagenContenedor: {
    width: '100%', height: '180px', position: 'relative',
    backgroundColor: '#1c1c1c', overflow: 'hidden'
  },
  imagen: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imagenPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    background: `
      repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 10px, rgba(255,255,255,0.05) 10px 11px),
      linear-gradient(180deg, #1c1c1c, #121212)`,
  },
  imagenOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, transparent 55%, rgba(20,20,20,0.92) 100%)',
    pointerEvents: 'none',
  },
  tipoBadgeOverlay: {
    position: 'absolute', top: 12, left: 12,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px',
    borderRadius: 999,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase',
  },
  tipoDot: { width: 6, height: 6, borderRadius: '50%' },
  arrowChip: {
    position: 'absolute', top: 12, right: 12,
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer', padding: 0,
    transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
  },
  favActivo: {
    color: '#E63946',
    borderColor: 'rgba(230,57,70,0.45)',
    background: 'rgba(230,57,70,0.18)',
  },
  contenido: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  titulo: {
    margin: 0,
    fontFamily: "'Oswald', sans-serif",
    fontSize: 17, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'rgba(255,255,255,1)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  grupos: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  dificultadBadge: {
    display: 'inline-flex', alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '3px 9px',
    borderRadius: 999,
    border: '1px solid',
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
  },
  grupoBadge: {
    padding: '3px 9px', borderRadius: 999,
    fontSize: 11, fontWeight: 500,
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  descripcion: {
    margin: 0, fontSize: 12.5, lineHeight: 1.5,
    color: 'rgba(255,255,255,0.45)',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden'
  },
  botonVerDetalles: {
    marginTop: 'auto', width: '100%', height: 40,
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,1)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 600, fontSize: 12,
    letterSpacing: '1.4px', textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 140ms ease, border-color 140ms ease',
  },
}
