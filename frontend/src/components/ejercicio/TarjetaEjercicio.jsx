export default function TarjetaEjercicio({ ejercicio, onVerDetalles }) {
  return (
    <div style={s.tarjeta}>
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
          <span style={{ fontSize: '36px' }}>💪</span>
        </div>
      </div>

      <div style={s.contenido}>
        <div style={s.tipoBadge}>
          <span style={{ ...s.badge, ...tipoBadgeColor(ejercicio.type) }}>
            {ejercicio.type ?? 'General'}
          </span>
        </div>

        <h3 style={s.titulo}>{ejercicio.title}</h3>

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
          <button style={s.botonAgregar} onClick={() => onVerDetalles(ejercicio)}>
            Ver detalles
          </button>
        )}
      </div>
    </div>
  )
}

function tipoBadgeColor(type) {
  switch (type) {
    case 'CARDIO':    return { backgroundColor: '#fff3cd', color: '#856404' }
    case 'FUERZA':    return { backgroundColor: '#fde8ea', color: '#c0392b' }
    case 'MOVILIDAD': return { backgroundColor: '#d4edda', color: '#155724' }
    default:          return { backgroundColor: '#e2e3e5', color: '#383d41' }
  }
}

const s = {
  tarjeta: {
    backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
    transition: 'transform 0.15s, box-shadow 0.15s'
  },
  imagenContenedor: {
    width: '100%', height: '180px', position: 'relative',
    backgroundColor: '#f5f5f5', overflow: 'hidden'
  },
  imagen: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imagenPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f0f0'
  },
  contenido: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  tipoBadge: {},
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  titulo: {
    margin: 0, fontSize: '15px', fontWeight: '700', color: '#111',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  grupos: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  grupoBadge: {
    padding: '2px 8px', borderRadius: '20px', fontSize: '11px',
    fontWeight: '500', backgroundColor: '#f0f0f0', color: '#555'
  },
  descripcion: {
    margin: 0, fontSize: '12px', color: '#888', lineHeight: '1.4',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden'
  },
  botonAgregar: {
    marginTop: 'auto', width: '100%', padding: '10px',
    backgroundColor: '#E63946', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer'
  }
}
