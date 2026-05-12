import { useResponsive } from '../../hooks/useMediaQuery'

export default function ModalDetallesEjercicio({ ejercicio, onCerrar }) {
  const { isMobile } = useResponsive()
  if (!ejercicio) return null

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div
        style={{
          ...s.modal,
          flexDirection: isMobile ? 'column' : 'row',
          maxWidth: isMobile ? '480px' : '860px',
          maxHeight: isMobile ? '88vh' : '560px',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Columna izquierda — Imagen */}
        <div style={{
          ...s.columnaImagen,
          width: isMobile ? '100%' : '42%',
          height: isMobile ? '200px' : 'auto',
        }}>
          {ejercicio.imageUrl ? (
            <img
              src={ejercicio.imageUrl}
              alt={ejercicio.title}
              style={s.imagen}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div style={{ ...s.imagenPlaceholder, display: ejercicio.imageUrl ? 'none' : 'flex' }}>
            <span style={{ fontSize: '72px' }}>💪</span>
          </div>
        </div>

        {/* Columna derecha — Info */}
        <div style={s.columnaInfo}>
          <button style={s.cerrar} onClick={onCerrar}>✕</button>

          {/* Badges: tipo + dificultad */}
          <div style={s.badgesRow}>
            <span style={{ ...s.badge, ...tipoBadgeColor(ejercicio.type) }}>
              {tipoLabel(ejercicio.type)}
            </span>
            {ejercicio.difficulty && (
              <span style={{ ...s.badge, ...dificultadBadgeColor(ejercicio.difficulty) }}>
                {dificultadLabel(ejercicio.difficulty)}
              </span>
            )}
          </div>

          {/* Nombre */}
          <h2 style={s.titulo}>{ejercicio.title}</h2>

          {/* Descripción */}
          {ejercicio.description && (
            <p style={s.descripcion}>{ejercicio.description}</p>
          )}

          {/* Grupos musculares */}
          {(ejercicio.muscleGroups ?? []).length > 0 && (
            <div>
              <p style={s.seccionLabel}>Grupos musculares</p>
              <div style={s.gruposWrap}>
                {(ejercicio.muscleGroups ?? []).map(g => (
                  <span key={g} style={s.grupoBadge}>{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tipoBadgeColor(type) {
  switch (type) {
    case 'CARDIO':    return { backgroundColor: 'rgba(255,140,66,0.18)', color: '#FF8C42',  borderColor: 'rgba(255,140,66,0.35)' }
    case 'FUERZA':    return { backgroundColor: 'rgba(99,179,237,0.18)', color: '#63B3ED',  borderColor: 'rgba(99,179,237,0.35)' }
    case 'MOVILIDAD': return { backgroundColor: 'rgba(78,205,196,0.18)', color: '#4ECDC4',  borderColor: 'rgba(78,205,196,0.35)' }
    default:          return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.15)' }
  }
}

function dificultadBadgeColor(difficulty) {
  switch (difficulty) {
    case 'PRINCIPIANTE': return { backgroundColor: 'rgba(72,187,120,0.18)',  color: '#48BB78', borderColor: 'rgba(72,187,120,0.35)' }
    case 'INTERMEDIO':   return { backgroundColor: 'rgba(237,208,73,0.18)',  color: '#EDD049', borderColor: 'rgba(237,208,73,0.35)' }
    case 'AVANZADO':     return { backgroundColor: 'rgba(230,57,70,0.18)',   color: '#E63946', borderColor: 'rgba(230,57,70,0.35)' }
    default:             return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.15)' }
  }
}

function tipoLabel(type) {
  const map = { CARDIO: 'Cardio', FUERZA: 'Fuerza', MOVILIDAD: 'Movilidad' }
  return map[type] ?? type ?? 'General'
}

function dificultadLabel(difficulty) {
  const map = { PRINCIPIANTE: 'Principiante', INTERMEDIO: 'Intermedio', AVANZADO: 'Avanzado' }
  return map[difficulty] ?? difficulty
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: '20px',
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: '20px',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
  },
  columnaImagen: {
    position: 'relative',
    backgroundColor: '#111',
    overflow: 'hidden',
    flexShrink: 0,
  },
  imagen: {
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
  },
  imagenPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  columnaInfo: {
    flex: 1,
    padding: '28px 28px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    position: 'relative',
    color: '#fff',
  },
  cerrar: {
    position: 'absolute', top: '14px', right: '14px',
    backgroundColor: 'rgba(255,255,255,0.09)',
    border: '1px solid rgba(255,255,255,0.13)',
    color: 'rgba(255,255,255,0.6)',
    width: '32px', height: '32px', borderRadius: '50%',
    cursor: 'pointer', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  badgesRow: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
    paddingRight: '44px',
    marginTop: '4px',
  },
  badge: {
    padding: '4px 12px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700',
    letterSpacing: '0.6px', textTransform: 'uppercase',
    border: '1px solid transparent',
  },
  titulo: {
    margin: 0,
    fontSize: '26px', fontWeight: '800',
    color: '#fff',
    fontFamily: "'Oswald', sans-serif",
    textTransform: 'uppercase', letterSpacing: '1px',
    lineHeight: '1.15',
  },
  descripcion: {
    margin: 0,
    fontSize: '14px', color: 'rgba(255,255,255,0.6)',
    lineHeight: '1.75', flex: 1,
  },
  seccionLabel: {
    margin: '0 0 8px',
    fontSize: '10px', fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '1.5px',
  },
  gruposWrap: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  grupoBadge: {
    padding: '5px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(255,255,255,0.11)',
  },
}
