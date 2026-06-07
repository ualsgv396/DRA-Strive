import { useState } from 'react'

const RED    = '#E63946'
const GOLD   = '#F59E0B'
const W      = 600
const H      = 200
const PAD    = { top: 16, right: 20, bottom: 44, left: 52 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top  - PAD.bottom

/**
 * Gráfica de línea SVG pura (sin dependencias externas).
 *
 * puntos — array de PuntoProgresoDto del backend
 * unidad — "KG" | "REPS" | "SECONDS" | "MINUTES"
 */
export default function GraficaLinea({ puntos = [], unidad = 'KG' }) {
  const [hovIdx, setHovIdx] = useState(null)

  if (puntos.length === 0) return null

  // Valor Y de cada punto: cargaMaxima si existe, si no repeticiones
  const vals = puntos.map(p => p.cargaMaxima != null ? Number(p.cargaMaxima) : (p.repeticiones ?? 0))
  const yMin  = Math.min(...vals)
  const yMax  = Math.max(...vals)
  const yRange = yMax - yMin || 1

  const xOf = (i) => PAD.left + (puntos.length === 1 ? INNER_W / 2 : (i / (puntos.length - 1)) * INNER_W)
  const yOf = (v) => PAD.top  + INNER_H - ((v - yMin) / yRange) * INNER_H

  // Subconjunto de etiquetas X para no saturar
  const labelStep = Math.ceil(puntos.length / 6)

  // Área bajo la curva (gradient fill)
  const linePoints = puntos.map((p, i) => `${xOf(i)},${yOf(vals[i])}`).join(' ')
  const areaPoints = `${xOf(0)},${H - PAD.bottom} ` + linePoints + ` ${xOf(puntos.length - 1)},${H - PAD.bottom}`

  // Y-axis ticks (5 niveles)
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    yMin + (yRange / 4) * i
  )

  const hovPunto = hovIdx != null ? puntos[hovIdx] : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="gradProgreso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={RED} stopOpacity="0.18" />
            <stop offset="100%" stopColor={RED} stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Líneas de cuadrícula Y */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={yOf(tick)}
              x2={W - PAD.right} y2={yOf(tick)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={yOf(tick) + 4}
              textAnchor="end"
              fontSize="11" fill="rgba(255,255,255,0.35)"
              fontFamily="'JetBrains Mono', monospace"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Área de relleno */}
        <polygon points={areaPoints} fill="url(#gradProgreso)" />

        {/* Línea principal */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={RED}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Puntos de datos */}
        {puntos.map((p, i) => {
          const cx = xOf(i)
          const cy = yOf(vals[i])
          const isPR  = p.esPR
          const isHov = hovIdx === i
          return (
            <g key={i}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
              onClick={() => setHovIdx(i === hovIdx ? null : i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Halo invisible para área de clic/hover más grande */}
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              {/* Punto principal */}
              <circle
                cx={cx} cy={cy}
                r={isPR ? 7 : (isHov ? 6 : 4)}
                fill={isPR ? GOLD : RED}
                stroke={isHov ? '#fff' : 'transparent'}
                strokeWidth="1.5"
                style={{ transition: 'r 0.1s' }}
              />
              {/* Estrella sobre PR */}
              {isPR && (
                <text x={cx} y={cy - 12} textAnchor="middle"
                  fontSize="11" fill={GOLD}>★</text>
              )}
            </g>
          )
        })}

        {/* Etiquetas eje X */}
        {puntos.map((p, i) => {
          if (i % labelStep !== 0 && i !== puntos.length - 1) return null
          const fecha = new Date(p.fecha + 'T00:00:00')
          const label = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
          return (
            <text
              key={i}
              x={xOf(i)} y={H - PAD.bottom + 16}
              textAnchor="middle"
              fontSize="10" fill="rgba(255,255,255,0.35)"
              fontFamily="'Inter', sans-serif"
            >
              {label}
            </text>
          )
        })}

        {/* Línea base X */}
        <line
          x1={PAD.left} y1={H - PAD.bottom}
          x2={W - PAD.right} y2={H - PAD.bottom}
          stroke="rgba(255,255,255,0.10)" strokeWidth="1"
        />
      </svg>

      {/* Tooltip / Info bar */}
      <div style={{
        minHeight: 32, marginTop: 6,
        fontFamily: "'Inter', sans-serif", fontSize: 13,
        color: hovPunto ? '#fff' : 'rgba(255,255,255,0.25)',
        textAlign: 'center', transition: 'color .15s',
      }}>
        {hovPunto ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {new Date(hovPunto.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            {'  ·  '}
            <strong style={{ color: hovPunto.esPR ? GOLD : RED }}>
              {hovPunto.cargaMaxima != null
                ? `${Number(hovPunto.cargaMaxima)} ${unidad}`
                : `${hovPunto.repeticiones} reps`}
            </strong>
            {'  ·  '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {hovPunto.series}×{hovPunto.repeticiones} reps
            </span>
            {hovPunto.esPR && <span style={{ color: GOLD, marginLeft: 8 }}>★ Récord personal</span>}
          </>
        ) : (
          'Toca un punto para ver el detalle'
        )}
      </div>
    </div>
  )
}
