import { useState } from 'react'

const UNIDADES = {
  CARDIO:   [{ value: 'SECONDS', label: 'Segundos' }, { value: 'MINUTES', label: 'Minutos' }],
  DEFAULT:  [{ value: 'KG', label: 'kg' }, { value: 'REPS', label: 'Repeticiones (peso corporal)' }]
}

export default function ModalAgregarEjercicio({ ejercicio, rutinas, onConfirmar, onCerrar }) {
  const esCardio = ejercicio?.type === 'CARDIO'
  const unidades = esCardio ? UNIDADES.CARDIO : UNIDADES.DEFAULT

  const [series, setSeries]       = useState(3)
  const [reps, setReps]           = useState(esCardio ? 1 : 10)
  const [loadValue, setLoadValue] = useState('')
  const [loadUnit, setLoadUnit]   = useState(unidades[0].value)
  const [rutinaId, setRutinaId]   = useState(rutinas?.[0]?.id?.toString() ?? '')
  const [error, setError]         = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!rutinaId) { setError('Selecciona una rutina'); return }
    onConfirmar(parseInt(rutinaId, 10), {
      sets: parseInt(series, 10),
      reps: parseInt(reps, 10),
      loadValue: loadValue !== '' ? parseFloat(loadValue) : null,
      loadUnit
    })
  }

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <div style={{ flex: 1 }}>
            <h2 style={s.titulo}>{ejercicio?.title}</h2>
            <div style={s.badges}>
              <span style={{ ...s.badge, ...tipoBadgeColor(ejercicio?.type) }}>
                {ejercicio?.type}
              </span>
              {(ejercicio?.muscleGroups ?? []).map(g => (
                <span key={g} style={s.grupoBadge}>{g}</span>
              ))}
            </div>
          </div>
          <button style={s.cerrar} onClick={onCerrar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fila}>
            <Campo label="Series">
              <input type="number" min="1" max="20" value={series}
                onChange={e => setSeries(e.target.value)} style={s.input} required />
            </Campo>
            <Campo label={esCardio ? 'Intervalos' : 'Repeticiones'}>
              <input type="number" min="1" max="999" value={reps}
                onChange={e => setReps(e.target.value)} style={s.input} required />
            </Campo>
          </div>

          <div style={s.fila}>
            <Campo label={esCardio ? 'Duración' : 'Carga'}>
              <input type="number" min="0" step="0.5" value={loadValue}
                onChange={e => setLoadValue(e.target.value)}
                placeholder="Opcional" style={s.input} />
            </Campo>
            <Campo label="Unidad">
              <select value={loadUnit} onChange={e => setLoadUnit(e.target.value)} style={s.select}>
                {unidades.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </Campo>
          </div>

          <Campo label="Añadir a rutina">
            {rutinas.length === 0
              ? <p style={s.sinRutinas}>No tienes rutinas creadas. Crea una primero desde el panel.</p>
              : (
                <select value={rutinaId} onChange={e => setRutinaId(e.target.value)} style={s.select}>
                  {rutinas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )
            }
          </Campo>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.acciones}>
            <button type="button" onClick={onCerrar} style={s.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={rutinas.length === 0}
              style={{ ...s.btnConfirmar, opacity: rutinas.length === 0 ? 0.5 : 1 }}>
              Añadir a rutina
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
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
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: '20px'
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px', width: '100%',
    maxWidth: '500px', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '24px 24px 20px', borderBottom: '1px solid #f0f0f0'
  },
  titulo: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111' },
  badges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badge: {
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600'
  },
  grupoBadge: {
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
    fontWeight: '500', backgroundColor: '#f0f0f0', color: '#555'
  },
  cerrar: {
    background: 'none', border: 'none', fontSize: '18px',
    cursor: 'pointer', color: '#999', lineHeight: 1, padding: '2px'
  },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  fila: { display: 'flex', gap: '16px' },
  input: {
    width: '100%', padding: '10px 12px', fontSize: '15px',
    border: '1px solid #ddd', borderRadius: '8px',
    boxSizing: 'border-box', outline: 'none'
  },
  select: {
    width: '100%', padding: '10px 12px', fontSize: '15px',
    border: '1px solid #ddd', borderRadius: '8px',
    boxSizing: 'border-box', backgroundColor: '#fff', cursor: 'pointer'
  },
  sinRutinas: { fontSize: '14px', color: '#999', margin: 0 },
  error: { color: '#E63946', fontSize: '14px', margin: 0 },
  acciones: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  btnCancelar: {
    padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px',
    backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555'
  },
  btnConfirmar: {
    padding: '10px 24px', border: 'none', borderRadius: '8px',
    backgroundColor: '#E63946', color: '#fff', cursor: 'pointer',
    fontSize: '14px', fontWeight: '700'
  }
}
