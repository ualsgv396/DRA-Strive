import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/ContextoAuth'
import api from '../api/axios'

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRESETS = {
  FUERZA:    { BAJA: { sets: 3, reps: 12, loadUnit: 'KG'      },
                MEDIA: { sets: 4, reps: 8,  loadUnit: 'KG'      },
                ALTA:  { sets: 5, reps: 5,  loadUnit: 'KG'      } },
  CARDIO:    { BAJA: { sets: 2, reps: 30, loadUnit: 'SECONDS'  },
                MEDIA: { sets: 3, reps: 45, loadUnit: 'SECONDS'  },
                ALTA:  { sets: 4, reps: 60, loadUnit: 'SECONDS'  } },
  MOVILIDAD: { BAJA: { sets: 2, reps: 30, loadUnit: 'SECONDS'  },
                MEDIA: { sets: 3, reps: 30, loadUnit: 'SECONDS'  },
                ALTA:  { sets: 3, reps: 45, loadUnit: 'SECONDS'  } }
}

// Orden canónico: Fuerza → Cardio → Movilidad (principal → acondicionamiento → enfriamiento)
const ORDEN_TIPO = { FUERZA: 1, CARDIO: 2, MOVILIDAD: 3 }
const ICONOS_TIPO = { CARDIO: '🏃', FUERZA: '💪', MOVILIDAD: '🧘' }
const COLORES_TIPO = { FUERZA: '#E63946', CARDIO: '#FF8C42', MOVILIDAD: '#4ECDC4' }

const ETIQUETAS_INTENSIDAD = {
  BAJA:  { label: 'Baja',  desc: 'Accesible · buen calentamiento', icon: '🌱' },
  MEDIA: { label: 'Media', desc: 'El punto dulce del esfuerzo',     icon: '🔥' },
  ALTA:  { label: 'Alta',  desc: 'Máxima exigencia',                icon: '⚡' }
}

// ─── Utilidades puras ─────────────────────────────────────────────────────────
function mezclar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Distribuye la cantidad total de ejercicios entre los tipos seleccionados.
 * Orden canónico: FUERZA (40–60%) → CARDIO (30%) → MOVILIDAD (30%, siempre al final como cool-down).
 */
function distribuirVolumen(tiposOrdenados, total) {
  if (tiposOrdenados.length === 1) return { [tiposOrdenados[0]]: total }
  if (tiposOrdenados.length === 2) {
    const a = Math.ceil(total * 0.6)
    return { [tiposOrdenados[0]]: a, [tiposOrdenados[1]]: total - a }
  }
  const a = Math.ceil(total * 0.4)
  const b = Math.ceil((total - a) * 0.5)
  return { [tiposOrdenados[0]]: a, [tiposOrdenados[1]]: b, [tiposOrdenados[2]]: total - a - b }
}

/** En combos, reduce 1 serie para no sobrecargar el volumen total. */
function getPreset(tipo, intensidad, esCombo) {
  const base = PRESETS[tipo][intensidad]
  if (!esCombo) return base
  return { ...base, sets: Math.max(2, base.sets - 1) }
}

function sortarTipos(tipos) {
  return [...tipos].sort((a, b) => ORDEN_TIPO[a] - ORDEN_TIPO[b])
}

function generarNombre(tipos, grupos) {
  const ordenados = sortarTipos(tipos)
  const tiposLabel = tipos.length === 3
    ? 'Full Body'
    : ordenados.map(t => t.charAt(0) + t.slice(1).toLowerCase()).join(' + ')
  const gruposLabel = grupos.length > 0
    ? grupos.slice(0, 2).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' & ')
    : 'Cuerpo Completo'
  return `Flash ${tiposLabel} · ${gruposLabel}`
}

function generarObjetivo(tipos, intensidad, cantidad) {
  const etiquetas = { FUERZA: 'fuerza', CARDIO: 'cardio', MOVILIDAD: 'movilidad' }
  const tiposLabel = sortarTipos(tipos).map(t => etiquetas[t]).join(', ')
  return `Sesión de ${tiposLabel} · ${cantidad} ejercicios · intensidad ${intensidad.toLowerCase()}`
}

/**
 * Selecciona ejercicios respetando el orden canónico de tipos y filtrando por grupos musculares.
 * Cada tipo aporta su cuota de ejercicios; MOVILIDAD siempre queda al final (cool-down).
 */
function seleccionarEjerciciosMultimodal(ejerciciosPorTipo, grupos, cantidad, tipos, intensidad) {
  const tiposOrdenados = sortarTipos(tipos)
  const esCombo = tiposOrdenados.length > 1
  const distribucion = distribuirVolumen(tiposOrdenados, cantidad)

  const resultado = []

  for (const tipo of tiposOrdenados) {
    const cuota = distribucion[tipo] || 0
    const todosDelTipo = ejerciciosPorTipo[tipo] || []
    const preset = getPreset(tipo, intensidad, esCombo)

    let candidatos = todosDelTipo
    if (grupos.length > 0) {
      const filtrados = todosDelTipo.filter(e =>
        e.muscleGroups?.some(g =>
          grupos.some(sel =>
            g.toLowerCase().includes(sel.toLowerCase()) ||
            sel.toLowerCase().includes(g.toLowerCase())
          )
        )
      )
      if (filtrados.length > 0) candidatos = filtrados
    }

    mezclar(candidatos).slice(0, cuota).forEach(e => {
      resultado.push({
        exerciseId: e.id,
        sets: preset.sets,
        reps: preset.reps,
        sortOrder: 0,
        loadUnit: preset.loadUnit,
        loadValue: null,
        _ejercicio: e,
        _tipo: tipo
      })
    })
  }

  return resultado.map((item, i) => ({ ...item, sortOrder: i }))
}

/** Convierte el input del usuario en minutos. Retorna 0 si inválido. */
function calcularMinutos(valor) {
  const h = parseInt(valor, 10)
  if (isNaN(h) || h <= 0 || h > 720) return 0
  return h * 60
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function FlashTraining() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1)
  const [tipos, setTipos] = useState([])
  const [grupos, setGrupos] = useState([])
  const [cantidad, setCantidad] = useState(6)
  const [intensidad, setIntensidad] = useState('MEDIA')
  const [duracion, setDuracion] = useState(24 * 60)
  const [duracionInput, setDuracionInput] = useState('')
  const [modoCustom, setModoCustom] = useState(false)

  const [ejerciciosPorTipo, setEjerciciosPorTipo] = useState({})
  const [gruposDisponibles, setGruposDisponibles] = useState([])
  const [cargandoEjercicios, setCargandoEjercicios] = useState(false)

  const [ejerciciosGenerados, setEjerciciosGenerados] = useState([])
  const [nombreRutina, setNombreRutina] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // ── Acciones ──
  const toggleTipo = (t) =>
    setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const cargarEjerciciosParaTipos = async (tiposACargar) => {
    setCargandoEjercicios(true)
    setError('')
    try {
      const peticiones = tiposACargar.map(t => api.get(`/exercises?type=${t}`))
      const respuestas = await Promise.all(peticiones)

      const porTipo = {}
      const todosLosGrupos = new Set()

      respuestas.forEach(({ data }, idx) => {
        const tipo = tiposACargar[idx]
        porTipo[tipo] = data
        data.forEach(e => e.muscleGroups?.forEach(g => todosLosGrupos.add(g)))
      })

      setEjerciciosPorTipo(porTipo)
      setGruposDisponibles([...todosLosGrupos].sort())
    } catch {
      setError('No se pudieron cargar los ejercicios. Inténtalo de nuevo.')
    } finally {
      setCargandoEjercicios(false)
    }
  }

  const toggleGrupo = (g) =>
    setGrupos(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const regenerar = () => {
    const generados = seleccionarEjerciciosMultimodal(
      ejerciciosPorTipo, grupos, cantidad, tipos, intensidad
    )
    setEjerciciosGenerados(generados)
  }

  const avanzar = () => {
    if (paso === 1) {
      setGrupos([])
      setEjerciciosPorTipo({})
      setGruposDisponibles([])
      cargarEjerciciosParaTipos(tipos)
    }
    if (paso === 4) {
      const nombre = generarNombre(tipos, grupos)
      const generados = seleccionarEjerciciosMultimodal(
        ejerciciosPorTipo, grupos, cantidad, tipos, intensidad
      )
      setNombreRutina(nombre)
      setEjerciciosGenerados(generados)
    }
    setPaso(p => p + 1)
  }

  const irAnterior = () => {
    if (paso === 2) setGrupos([])
    setPaso(p => p - 1)
  }

  const confirmar = async () => {
    setGuardando(true)
    setError('')
    try {
      const { data: nuevaRutina } = await api.post('/routines/flash', {
        name: nombreRutina,
        goal: generarObjetivo(tipos, intensidad, cantidad),
        ownerId: usuario.id,
        exercises: ejerciciosGenerados.map(({ _ejercicio, _tipo, ...rest }) => rest),
        flashDurationMinutes: duracion
      })
      // Navega con la rutina creada para que Panel la muestre sin esperar la API
      navigate('/panel', { state: { nuevaRutina } })
    } catch {
      setError('Error al crear el Flash Training. Inténtalo de nuevo.')
      setGuardando(false)
    }
  }

  const puedeAvanzar = () => {
    if (paso === 1) return tipos.length > 0
    if (paso === 2) return !cargandoEjercicios && !error
    if (paso === 3) return true
    if (paso === 4) {
      if (modoCustom) return calcularMinutos(duracionInput) > 0
      return duracion > 0
    }
    return false
  }

  const activarModoCustom = () => {
    setModoCustom(true)
    setDuracionInput('')
    setDuracion(0) // Fuerza al usuario a introducir un valor válido
  }

  const onCambiarDuracionCustom = (valor) => {
    setDuracionInput(valor)
    const mins = calcularMinutos(valor)
    setDuracion(mins)
  }

  const seleccionarPresetDuracion = (horas) => {
    setModoCustom(false)
    setDuracionInput('')
    setDuracion(horas * 60)
  }

  const duracionLabel = (mins) => {
    if (!mins || mins <= 0) return '—'
    if (mins < 60) return `${mins} min`
    return `${mins / 60}h`
  }

  // ── Render ──
  const tiposOrdenadosPreview = sortarTipos(tipos)

  return (
    <div style={s.contenedor}>
      {/* Cabecera */}
      <div style={s.header}>
        <button style={s.btnVolver} onClick={() => navigate('/panel')}>← Volver</button>
        <div style={s.logo}>⚡ FLASH TRAINING</div>
        <div style={s.progreso}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ ...s.punto, ...(n < paso ? s.puntoCompletado : n === paso ? s.puntoActivo : {}) }} />
          ))}
        </div>
      </div>

      <div style={s.contenido}>

        {/* ── PASO 1: Tipos (multi-select) ── */}
        {paso === 1 && (
          <div style={s.paso}>
            <p style={s.preguntaNum}>Pregunta 1 de 4</p>
            <h2 style={s.pregunta}>¿Qué tipo de entrenamiento quieres hoy?</h2>
            <p style={s.subtexto}>Selecciona uno o varios. La rutina equilibrará el volumen automáticamente.</p>

            <div style={s.opcionesGrid}>
              {['CARDIO', 'FUERZA', 'MOVILIDAD'].map(t => {
                const sel = tipos.includes(t)
                return (
                  <button
                    key={t}
                    style={{
                      ...s.opcionGrande,
                      ...(sel ? { ...s.opcionSeleccionada, borderColor: COLORES_TIPO[t], boxShadow: `0 0 20px ${COLORES_TIPO[t]}33` } : {})
                    }}
                    onClick={() => toggleTipo(t)}
                  >
                    {sel && <span style={s.checkmark}>✓</span>}
                    <span style={s.opcionIcono}>{ICONOS_TIPO[t]}</span>
                    <span style={s.opcionLabel}>{t}</span>
                  </button>
                )
              })}
            </div>

            {tipos.length > 1 && (
              <div style={s.comboBanner}>
                <span style={s.comboIcono}>🔀</span>
                <span style={s.comboTexto}>
                  Modo <strong>multimodal</strong>: {sortarTipos(tipos).map(t => ICONOS_TIPO[t] + ' ' + t).join(' → ')}
                  {tipos.includes('MOVILIDAD') && ' (movilidad como cool-down)'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Grupos musculares ── */}
        {paso === 2 && (
          <div style={s.paso}>
            <p style={s.preguntaNum}>Pregunta 2 de 4</p>
            <h2 style={s.pregunta}>¿En qué grupos musculares quieres enfocarte?</h2>
            <p style={s.subtexto}>Opcional. Si no seleccionas nada, usaremos todos los ejercicios disponibles.</p>

            {cargandoEjercicios ? (
              <p style={s.cargando}>Cargando ejercicios para {tiposOrdenadosPreview.map(t => ICONOS_TIPO[t]).join(' ')}...</p>
            ) : error ? (
              <p style={s.errorInline}>{error}</p>
            ) : (
              <>
                <div style={s.gruposWrap}>
                  {gruposDisponibles.map(g => (
                    <button
                      key={g}
                      style={{ ...s.chip, ...(grupos.includes(g) ? s.chipSeleccionado : {}) }}
                      onClick={() => toggleGrupo(g)}
                    >
                      {g}
                    </button>
                  ))}
                  {gruposDisponibles.length === 0 && (
                    <p style={s.sinEjercicios}>No hay ejercicios para los tipos seleccionados.</p>
                  )}
                </div>

                {/* Resumen de disponibilidad */}
                <div style={s.disponibilidadWrap}>
                  {tiposOrdenadosPreview.map(t => (
                    <span key={t} style={s.disponibilidadChip}>
                      {ICONOS_TIPO[t]} {ejerciciosPorTipo[t]?.length ?? 0} ejercicios
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PASO 3: Configuración ── */}
        {paso === 3 && (
          <div style={s.paso}>
            <p style={s.preguntaNum}>Pregunta 3 de 4</p>
            <h2 style={s.pregunta}>¿Cómo quieres configurar el entrenamiento?</h2>

            <div style={s.seccion}>
              <p style={s.seccionLabel}>Número de ejercicios en total</p>
              <div style={s.opcionesRow}>
                {[4, 6, 8].map(n => (
                  <button
                    key={n}
                    style={{ ...s.opcionNum, ...(cantidad === n ? s.opcionNumSeleccionado : {}) }}
                    onClick={() => setCantidad(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {tipos.length > 1 && (
                <p style={s.distribucionInfo}>
                  Distribución estimada: {sortarTipos(tipos).map(t => {
                    const dist = distribuirVolumen(sortarTipos(tipos), cantidad)
                    return `${ICONOS_TIPO[t]} ${dist[t]}`
                  }).join(' · ')}
                </p>
              )}
            </div>

            <div style={s.seccion}>
              <p style={s.seccionLabel}>Intensidad</p>
              <div style={s.opcionesRow}>
                {['BAJA', 'MEDIA', 'ALTA'].map(i => (
                  <button
                    key={i}
                    style={{ ...s.opcionIntensidad, ...(intensidad === i ? s.opcionIntensidadSel : {}) }}
                    onClick={() => setIntensidad(i)}
                  >
                    <span style={{ fontSize: '20px' }}>{ETIQUETAS_INTENSIDAD[i].icon}</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {ETIQUETAS_INTENSIDAD[i].label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" }}>
                      {ETIQUETAS_INTENSIDAD[i].desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tabla de presets por tipo */}
              <div style={s.presetsTabla}>
                {tiposOrdenadosPreview.map(t => {
                  const p = getPreset(t, intensidad, tipos.length > 1)
                  return (
                    <div key={t} style={s.presetFila}>
                      <span style={s.presetTipoIcono}>{ICONOS_TIPO[t]}</span>
                      <span style={{ ...s.presetTipoLabel, color: COLORES_TIPO[t] }}>{t}</span>
                      <span style={s.presetValor}>
                        {p.sets} series × {p.reps}{p.loadUnit === 'SECONDS' ? 's' : ' reps'}
                      </span>
                    </div>
                  )
                })}
              </div>
              {tipos.length > 1 && (
                <p style={s.comboNote}>* Volumen reducido automáticamente para equilibrar la sesión combinada.</p>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 4: Duración ── */}
        {paso === 4 && (
          <div style={s.paso}>
            <p style={s.preguntaNum}>Pregunta 4 de 4</p>
            <h2 style={s.pregunta}>¿Por cuánto tiempo estará disponible?</h2>
            <p style={s.subtexto}>Cuando expire, desaparecerá del panel pero quedará en tu historial.</p>

            <div style={s.opcionesRow}>
              {[24, 48, 72].map(h => (
                <button
                  key={h}
                  style={{ ...s.opcionDuracion, ...(!modoCustom && duracion === h * 60 ? s.opcionDuracionSel : {}) }}
                  onClick={() => seleccionarPresetDuracion(h)}
                >
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '22px', fontWeight: '700' }}>{h}h</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {h === 24 ? 'Un día' : h === 48 ? 'Dos días' : 'Tres días'}
                  </span>
                </button>
              ))}
              <button
                style={{ ...s.opcionDuracion, ...(modoCustom ? s.opcionDuracionSel : {}) }}
                onClick={activarModoCustom}
              >
                <span style={{ fontSize: '20px' }}>⚙️</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Personalizado</span>
              </button>
            </div>

            {modoCustom && (
              <div style={s.customWrap}>
                <label style={s.customLabel}>Número de horas (1–720)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={duracionInput}
                    onChange={e => onCambiarDuracionCustom(e.target.value)}
                    style={s.inputCustom}
                    placeholder="ej. 12"
                    autoFocus
                  />
                  {duracion > 0 && (
                    <span style={s.customConfirm}>✓ {duracionLabel(duracion)}</span>
                  )}
                  {duracionInput && duracion === 0 && (
                    <span style={s.customError}>Valor inválido (1–720 h)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 5: Preview y confirmación ── */}
        {paso === 5 && (
          <div style={s.paso}>
            <p style={s.preguntaNum}>Resumen</p>
            <h2 style={s.pregunta}>Tu Flash Training está listo</h2>

            <div style={s.previewCard}>
              <div style={s.flashBarra} />
              <div style={s.previewHeader}>
                <div>
                  <span style={s.flashBadge}>⚡ FLASH</span>
                  <h3 style={s.previewNombre}>{nombreRutina}</h3>
                </div>
                <div style={s.previewMeta}>
                  {tiposOrdenadosPreview.map(t => (
                    <span key={t} style={{ ...s.metaChip, borderColor: COLORES_TIPO[t] + '60', color: COLORES_TIPO[t] }}>
                      {ICONOS_TIPO[t]} {t}
                    </span>
                  ))}
                  <span style={s.metaChip}>{ETIQUETAS_INTENSIDAD[intensidad].icon} {intensidad}</span>
                  <span style={s.metaChip}>⏱ {duracionLabel(duracion)}</span>
                </div>
              </div>

              <div style={s.listaEjercicios}>
                {ejerciciosGenerados.map((item, i) => (
                  <div key={`${item.exerciseId}-${i}`} style={s.itemEjercicio}>
                    <span style={s.itemNum}>{i + 1}</span>
                    <span style={{ ...s.itemTipoIcon, color: COLORES_TIPO[item._tipo] }}>
                      {ICONOS_TIPO[item._tipo]}
                    </span>
                    <span style={s.itemNombre}>{item._ejercicio.title}</span>
                    <span style={s.itemConfig}>
                      {item.sets}×{item.reps}{item.loadUnit === 'SECONDS' ? 's' : ''}
                    </span>
                  </div>
                ))}
                {ejerciciosGenerados.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px 0' }}>
                    No hay ejercicios para los criterios seleccionados.
                  </p>
                )}
              </div>
            </div>

            {error && <p style={s.error}>{error}</p>}

            <div style={s.accionesFinal}>
              <button style={s.btnRegenerar} onClick={regenerar} disabled={guardando}>
                🔀 Regenerar
              </button>
              <button
                style={{ ...s.btnConfirmar, ...(guardando || ejerciciosGenerados.length === 0 ? s.btnDeshabilitado : {}) }}
                onClick={confirmar}
                disabled={guardando || ejerciciosGenerados.length === 0}
              >
                {guardando ? 'Guardando...' : '⚡ Confirmar Flash Training'}
              </button>
            </div>
          </div>
        )}

        {/* Navegación */}
        {paso < 5 && (
          <div style={s.navegacion}>
            {paso > 1 && (
              <button style={s.btnAnterior} onClick={irAnterior}>
                ← Anterior
              </button>
            )}
            <button
              style={{ ...s.btnSiguiente, ...(!puedeAvanzar() ? s.btnDeshabilitado : {}) }}
              onClick={avanzar}
              disabled={!puedeAvanzar()}
            >
              {paso === 4 ? '⚡ Generar entrenamiento' : 'Siguiente →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  contenedor: { minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#FFFFFF' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#111'
  },
  btnVolver: {
    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
    fontSize: '14px', fontFamily: "'Inter', sans-serif", cursor: 'pointer'
  },
  logo: {
    fontFamily: "'Oswald', sans-serif", fontSize: '20px', fontWeight: '700',
    letterSpacing: '2px', color: '#FF8C42'
  },
  progreso: { display: 'flex', gap: '8px', alignItems: 'center' },
  punto: {
    width: '10px', height: '10px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)', transition: 'all 0.3s'
  },
  puntoActivo: { backgroundColor: '#FF8C42', transform: 'scale(1.2)' },
  puntoCompletado: { backgroundColor: 'rgba(255,140,66,0.4)' },
  contenido: { maxWidth: '680px', margin: '0 auto', padding: '60px 24px 104px' },
  paso: {},
  preguntaNum: {
    fontSize: '12px', fontFamily: "'Inter', sans-serif", color: '#FF8C42',
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px'
  },
  pregunta: {
    fontFamily: "'Oswald', sans-serif", fontSize: '32px', fontWeight: '700',
    textTransform: 'uppercase', marginBottom: '16px', lineHeight: '1.2'
  },
  subtexto: {
    fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif",
    marginBottom: '28px', lineHeight: '1.5'
  },
  opcionesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  opcionGrande: {
    background: '#1A1A1A', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '28px 16px', cursor: 'pointer', color: '#fff', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
    position: 'relative'
  },
  opcionSeleccionada: { backgroundColor: 'rgba(255,140,66,0.08)' },
  checkmark: {
    position: 'absolute', top: '10px', right: '12px', fontSize: '14px',
    color: '#FF8C42', fontWeight: '700'
  },
  opcionIcono: { fontSize: '32px' },
  opcionLabel: {
    fontFamily: "'Oswald', sans-serif", fontSize: '15px', fontWeight: '700',
    letterSpacing: '1px', textTransform: 'uppercase'
  },
  comboBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(255,140,66,0.08)', border: '1px solid rgba(255,140,66,0.2)',
    borderRadius: '10px', padding: '12px 16px', marginTop: '4px'
  },
  comboIcono: { fontSize: '16px' },
  comboTexto: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", lineHeight: '1.4' },
  gruposWrap: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' },
  chip: {
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px',
    padding: '8px 16px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
    fontSize: '13px', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s'
  },
  chipSeleccionado: { border: '1px solid #FF8C42', backgroundColor: 'rgba(255,140,66,0.15)', color: '#FF8C42' },
  disponibilidadWrap: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  disponibilidadChip: {
    background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px 12px',
    fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif"
  },
  cargando: { color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '14px' },
  sinEjercicios: { color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '14px', padding: '20px 0' },
  errorInline: { color: '#FF4D4D', fontFamily: "'Inter', sans-serif", fontSize: '14px' },
  seccion: { marginBottom: '32px' },
  seccionLabel: {
    fontSize: '12px', fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '14px'
  },
  opcionesRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  opcionNum: {
    background: '#1A1A1A', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    width: '64px', height: '64px', fontSize: '22px', fontFamily: "'Oswald', sans-serif",
    fontWeight: '700', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
  },
  opcionNumSeleccionado: { border: '2px solid #FF8C42', backgroundColor: 'rgba(255,140,66,0.12)', color: '#FF8C42' },
  distribucionInfo: {
    marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Inter', sans-serif"
  },
  opcionIntensidad: {
    background: '#1A1A1A', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '16px 20px', flex: '1', minWidth: '120px', cursor: 'pointer', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
  },
  opcionIntensidadSel: { border: '2px solid #FF8C42', backgroundColor: 'rgba(255,140,66,0.12)' },
  presetsTabla: {
    marginTop: '16px', background: '#1A1A1A', borderRadius: '10px',
    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)'
  },
  presetFila: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)'
  },
  presetTipoIcono: { fontSize: '16px', flexShrink: 0 },
  presetTipoLabel: { fontSize: '12px', fontFamily: "'Oswald', sans-serif", fontWeight: '700', letterSpacing: '1px', width: '80px' },
  presetValor: { fontSize: '13px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' },
  comboNote: { marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif" },
  opcionDuracion: {
    background: '#1A1A1A', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '20px 24px', cursor: 'pointer', color: '#fff', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '1',
    minWidth: '100px', transition: 'all 0.2s'
  },
  opcionDuracionSel: { border: '2px solid #FF8C42', backgroundColor: 'rgba(255,140,66,0.12)' },
  customWrap: { marginTop: '24px', padding: '20px', background: '#1A1A1A', borderRadius: '12px' },
  customLabel: {
    display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Inter', sans-serif", marginBottom: '10px'
  },
  inputCustom: {
    background: '#2A2A2A', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    color: '#fff', fontSize: '18px', fontFamily: "'Oswald', sans-serif",
    padding: '10px 16px', width: '120px', outline: 'none'
  },
  customConfirm: { fontSize: '13px', color: '#4ECDC4', fontFamily: "'Inter', sans-serif" },
  customError: { fontSize: '12px', color: '#FF4D4D', fontFamily: "'Inter', sans-serif" },
  previewCard: {
    background: 'linear-gradient(135deg, #1a0a05 0%, #111 55%, #0a0a1a 100%)',
    border: '1px solid rgba(255,140,66,0.35)', borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 0 30px rgba(255,140,66,0.1)', marginBottom: '24px'
  },
  flashBarra: { height: '3px', background: 'linear-gradient(90deg, #E63946, #FF8C42, #4ECDC4)', flexShrink: 0 },
  previewHeader: {
    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px'
  },
  flashBadge: {
    display: 'inline-block', background: 'linear-gradient(90deg, #FF8C42, #FF4D4D)', color: '#fff',
    fontSize: '10px', fontFamily: "'Oswald', sans-serif", fontWeight: '700', letterSpacing: '1.5px',
    padding: '3px 10px', borderRadius: '20px', marginBottom: '6px'
  },
  previewNombre: {
    fontFamily: "'Oswald', sans-serif", fontSize: '20px', fontWeight: '700',
    textTransform: 'uppercase', color: '#fff'
  },
  previewMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  metaChip: {
    background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '20px',
    fontSize: '11px', fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.6)',
    border: '1px solid transparent'
  },
  listaEjercicios: { padding: '8px 0' },
  itemEjercicio: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)'
  },
  itemNum: {
    width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,140,66,0.15)',
    color: '#FF8C42', fontSize: '11px', fontWeight: '700', fontFamily: "'Oswald', sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  itemTipoIcon: { fontSize: '14px', flexShrink: 0 },
  itemNombre: { flex: 1, fontSize: '14px', fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.85)' },
  itemConfig: { fontSize: '13px', fontFamily: 'monospace', color: '#FF8C42', fontWeight: '700' },
  navegacion: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px' },
  btnAnterior: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.6)', padding: '14px 24px', fontSize: '15px',
    fontFamily: "'Inter', sans-serif", cursor: 'pointer'
  },
  btnSiguiente: {
    background: '#FF8C42', border: 'none', borderRadius: '8px', color: '#fff',
    padding: '14px 32px', fontSize: '15px', fontFamily: "'Oswald', sans-serif",
    fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
  },
  btnDeshabilitado: { opacity: 0.35, cursor: 'not-allowed' },
  accionesFinal: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  btnRegenerar: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.6)', padding: '14px 24px', fontSize: '14px',
    fontFamily: "'Inter', sans-serif", cursor: 'pointer'
  },
  btnConfirmar: {
    background: 'linear-gradient(90deg, #FF8C42, #FF4D4D)', border: 'none', borderRadius: '8px',
    color: '#fff', padding: '14px 32px', fontSize: '15px', fontFamily: "'Oswald', sans-serif",
    fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
    boxShadow: '0 0 20px rgba(255,140,66,0.3)'
  },
  error: {
    color: '#FF4D4D', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginBottom: '16px',
    padding: '12px 16px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px',
    border: '1px solid rgba(255,77,77,0.2)'
  }
}
