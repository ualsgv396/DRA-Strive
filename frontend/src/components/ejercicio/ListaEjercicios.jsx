import { useState, useEffect } from 'react'
import TarjetaEjercicio from './TarjetaEjercicio'

export default function ListaEjercicios({
  ejercicios, cargando, onVerDetalles,
  filtro = '', tipoFiltro = null, muscleGroupFiltro = null
}) {
  const [filtrados, setFiltrados] = useState(ejercicios)

  useEffect(() => {
    let result = ejercicios

    if (filtro) {
      const q = filtro.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      )
    }

    if (tipoFiltro) {
      result = result.filter(e => e.type === tipoFiltro)
    }

    if (muscleGroupFiltro) {
      result = result.filter(e =>
        (e.muscleGroups ?? []).includes(muscleGroupFiltro)
      )
    }

    setFiltrados(result)
  }, [ejercicios, filtro, tipoFiltro, muscleGroupFiltro])

  if (cargando) {
    return (
      <div style={s.centro}>
        <div style={s.spinner} />
        <p style={{ color: '#888', margin: 0 }}>Cargando ejercicios...</p>
      </div>
    )
  }

  if (filtrados.length === 0) {
    return (
      <div style={s.centro}>
        <span style={{ fontSize: '40px' }}>🔍</span>
        <p style={{ color: '#aaa', margin: 0 }}>No se encontraron ejercicios</p>
        {(filtro || tipoFiltro || muscleGroupFiltro) &&
          <p style={{ fontSize: '13px', color: '#bbb', margin: 0 }}>Prueba a cambiar los filtros</p>
        }
      </div>
    )
  }

  return (
    <div style={s.grid}>
      {filtrados.map(ejercicio => (
        <TarjetaEjercicio
          key={ejercicio.id}
          ejercicio={ejercicio}
          onVerDetalles={onVerDetalles}
        />
      ))}
    </div>
  )
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px', width: '100%'
  },
  centro: {
    padding: '60px 20px', textAlign: 'center',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px'
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #E63946',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
}
