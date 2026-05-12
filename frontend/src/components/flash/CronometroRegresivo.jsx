import { useState, useEffect, useRef } from 'react'

/**
 * Convierte el valor de flashExpiresAt al tipo Date de forma defensiva.
 * Maneja tanto ISO strings ("2024-04-30T12:00:00") como el formato array de
 * Jackson sin configurar ([2024, 4, 30, 12, 0, 0]).
 */
function parseExpiry(expiresAt) {
  if (!expiresAt) return null
  if (Array.isArray(expiresAt)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = expiresAt
    return new Date(year, month - 1, day, hour, min, sec)
  }
  const d = new Date(expiresAt)
  return isNaN(d.getTime()) ? null : d
}

function calcularRestante(expiresAt) {
  const expDate = parseExpiry(expiresAt)
  if (!expDate) return { horas: 0, minutos: 0, segundos: 0, expirado: true, totalSegundos: 0 }
  const diff = expDate.getTime() - Date.now()
  if (diff <= 0) return { horas: 0, minutos: 0, segundos: 0, expirado: true, totalSegundos: 0 }
  const totalSegundos = Math.floor(diff / 1000)
  return {
    horas: Math.floor(totalSegundos / 3600),
    minutos: Math.floor((totalSegundos % 3600) / 60),
    segundos: totalSegundos % 60,
    expirado: false,
    totalSegundos
  }
}

const pad = (n) => String(n).padStart(2, '0')

export default function CronometroRegresivo({ expiresAt, onExpire, estiloTexto = {} }) {
  const [tiempo, setTiempo] = useState(() => calcularRestante(expiresAt))
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (tiempo.expirado) {
      onExpireRef.current?.()
      return
    }

    const interval = setInterval(() => {
      const t = calcularRestante(expiresAt)
      setTiempo(t)
      if (t.expirado) {
        clearInterval(interval)
        onExpireRef.current?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, tiempo.expirado])

  if (tiempo.expirado) {
    return <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.3)', ...estiloTexto }}>EXPIRADO</span>
  }

  const urgente = tiempo.totalSegundos < 3600

  return (
    <span style={{
      fontFamily: 'monospace',
      fontWeight: '700',
      fontSize: '13px',
      letterSpacing: '1px',
      color: urgente ? '#FF4D4D' : '#FF8C42',
      ...estiloTexto
    }}>
      {pad(tiempo.horas)}:{pad(tiempo.minutos)}:{pad(tiempo.segundos)}
    </span>
  )
}
