import TarjetaEjercicio from './TarjetaEjercicio'
import { useState, useEffect } from 'react'

export default function ListaEjercicios({
  ejercicios, cargando, onVerDetalles,
  filtro = '', tipoFiltro = null, muscleGroupFiltro = null,
  favoritos, onToggleFavorito
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
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 13 }}>Cargando ejercicios...</p>
      </div>
    )
  }

  if (filtrados.length === 0) {
    return (
      <div style={s.centro}>
        <span style={{ fontSize: '40px', opacity: 0.65 }}>🔍</span>
        <p style={{ color: 'rgba(255,255,255,0.72)', margin: 0 }}>No se encontraron ejercicios</p>
        {(filtro || tipoFiltro || muscleGroupFiltro) &&
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Prueba a cambiar los filtros</p>
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
          esFavorito={favoritos?.has(String(ejercicio.id))}
          onToggleFavorito={onToggleFavorito}
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
    border: '3px solid rgba(255,255,255,0.08)',
    borderTop: '3px solid #E63946',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
}
