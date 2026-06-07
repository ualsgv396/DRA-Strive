/* ════════════════════════════════════════════════════════════════════════
   Logros.jsx   (Tarea 2 — página de logros dedicada, rediseñada)
   Ubicación destino:  src/pages/Logros.jsx
   ────────────────────────────────────────────────────────────────────────
   • Iconos lineales premium (sin emojis) vía IconosLogros.
   • Tarjetas más amplias, sin bordes finos, sombra sutil + fondo #1A1A1A.
   • Desbloqueado: brillo rojo sutil + medallón de check rojo en esquina.
   • Bloqueado: icono atenuado, "???" y candado minimalista.
   • Cabecera con barra de progreso fina y % discreto.
   • Conserva el modal de detalle (ahora con el icono lineal).
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGamification, BADGE_META } from '../hooks/useGamification'
import { Iconos, BadgeIcon, COLOR_RED, COLOR_RED_SOFT } from '../components/gamificacion/IconosLogros'

const RED      = COLOR_RED
const RED_SOFT = COLOR_RED_SOFT

const ORDEN = [
  'FIRST_SESSION', 'SESSIONS_5', 'SESSIONS_10', 'SESSIONS_25', 'SESSIONS_50',
  'STREAK_3', 'STREAK_7', 'STREAK_30',
  'FIRST_ROUTINE', 'ROUTINES_5',
  'FIRST_FRIEND', 'FIRST_SHARE',
]

const CRITERIOS = {
  FIRST_SESSION: { objetivo: 1,  unidad: 'sesión completada',     tipo: 'sesiones',   reto: 'Completa tu primera sesión de entrenamiento y da el primer paso.' },
  SESSIONS_5:    { objetivo: 5,  unidad: 'sesiones completadas',  tipo: 'sesiones',   reto: 'Completa 5 sesiones de entrenamiento y empieza a construir el hábito.' },
  SESSIONS_10:   { objetivo: 10, unidad: 'sesiones completadas',  tipo: 'sesiones',   reto: 'Completa 10 sesiones y demuestra que la constancia es tu arma.' },
  SESSIONS_25:   { objetivo: 25, unidad: 'sesiones completadas',  tipo: 'sesiones',   reto: 'Alcanza 25 entrenamientos y demuestra tu dedicación inquebrantable.' },
  SESSIONS_50:   { objetivo: 50, unidad: 'sesiones completadas',  tipo: 'sesiones',   reto: '50 entrenamientos: el camino hacia la élite empieza aquí.' },
  STREAK_3:      { objetivo: 3,  unidad: 'días consecutivos',     tipo: 'racha',      reto: 'Entrena 3 días seguidos sin perder el ritmo ni un solo día.' },
  STREAK_7:      { objetivo: 7,  unidad: 'días consecutivos',     tipo: 'racha',      reto: 'Completa una semana entera de entrenamiento sin saltarte ningún día.' },
  STREAK_30:     { objetivo: 30, unidad: 'días consecutivos',     tipo: 'racha',      reto: 'Entrena cada día durante un mes completo. Eres una máquina.' },
  FIRST_ROUTINE: { objetivo: 1,  unidad: 'rutina creada',         tipo: 'rutinas',    reto: 'Diseña tu primera rutina personalizada y toma el control de tu entrenamiento.' },
  ROUTINES_5:    { objetivo: 5,  unidad: 'rutinas creadas',       tipo: 'rutinas',    reto: 'Crea 5 rutinas diferentes y diversifica tu arsenal de entrenamiento.' },
  FIRST_FRIEND:  { objetivo: 1,  unidad: 'amigo añadido',         tipo: 'amigos',     reto: 'Añade a tu primer compañero de entrenamiento. Juntos es mejor.' },
  FIRST_SHARE:   { objetivo: 1,  unidad: 'rutina compartida',     tipo: 'compartir',  reto: 'Comparte tu primera rutina con la comunidad y muestra lo que vales.' },
}

function inferirProgreso(tipo, datos) {
  if (!datos) return 0
  const desbloqueados = new Set((datos.logros || []).map(l => l.tipo))
  switch (CRITERIOS[tipo].tipo) {
    case 'sesiones':
      if (desbloqueados.has('SESSIONS_50')) return 50
      if (desbloqueados.has('SESSIONS_25')) return 25
      if (desbloqueados.has('SESSIONS_10')) return 10
      if (desbloqueados.has('SESSIONS_5'))  return 5
      if (desbloqueados.has('FIRST_SESSION')) return 1
      return 0
    case 'racha':
      return Math.max(datos.rachaMasLarga || 0, datos.rachaActual || 0)
    case 'rutinas':
      if (desbloqueados.has('ROUTINES_5'))    return 5
      if (desbloqueados.has('FIRST_ROUTINE')) return 1
      return 0
    case 'amigos':
      return desbloqueados.has('FIRST_FRIEND') ? 1 : 0
    case 'compartir':
      return desbloqueados.has('FIRST_SHARE') ? 1 : 0
    default:
      return 0
  }
}

// ── Modal de detalle ────────────────────────────────────────────────────────
function ModalLogro({ tipo, badge, datos, onCerrar }) {
  const meta         = BADGE_META[tipo]
  const criterio     = CRITERIOS[tipo]
  const desbloqueado = !!badge
  const actual       = inferirProgreso(tipo, datos)
  const total        = criterio.objetivo
  const pct          = Math.min(100, Math.round((actual / total) * 100))
  const restantes    = Math.max(0, total - actual)

  return (
    <div style={ms.overlay} onClick={onCerrar}>
      <div style={ms.modal} onClick={e => e.stopPropagation()}>
        <button style={ms.cerrar} onClick={onCerrar} aria-label="Cerrar">✕</button>

        <div style={ms.encabezado}>
          <BadgeIcon tipo={tipo} size={46} unlocked={desbloqueado} lock />
          <h2 style={ms.titulo}>{meta.nombre.toUpperCase()}</h2>
          <p style={ms.desc}>{meta.desc}</p>

          {desbloqueado ? (
            <span style={ms.fechaChip}>
              Desbloqueado el {new Date(badge.desbloqueadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          ) : (
            <span style={ms.bloqueadoChip}>Aún bloqueado</span>
          )}
        </div>

        <div style={ms.progresoSeccion}>
          <div style={ms.progresoFila}>
            <span style={ms.progresoLabel}>Progreso</span>
            <span style={ms.progresoValor}>{actual} / {total} {criterio.unidad}</span>
          </div>
          <div style={ms.barraFondo}>
            <div style={{ ...ms.barraRelleno, width: `${pct}%`,
              background: desbloqueado ? `linear-gradient(90deg, ${RED}, ${RED_SOFT})` : RED }} />
          </div>
          <p style={ms.pctTexto}>{pct}% completado</p>
        </div>

        <div style={ms.retoBox}>
          <p style={ms.retoTexto}>“{criterio.reto}”</p>
        </div>

        <div style={ms.criteriosGrid}>
          <div style={ms.criterioBloque}>
            <h4 style={ms.criterioTitulo}>Lo que he hecho</h4>
            <p style={ms.criterioValorGrande}>{actual} {criterio.unidad}</p>
            <p style={ms.criterioDesc}>
              {desbloqueado
                ? '¡Objetivo alcanzado! Sigue superándote.'
                : actual > 0 ? `Has completado ${actual} de ${total}.` : 'Aún no has comenzado con este reto.'}
            </p>
          </div>
          <div style={ms.criterioBloque}>
            <h4 style={ms.criterioTitulo}>Lo que debo hacer</h4>
            {desbloqueado
              ? <p style={ms.criterioDesc}>¡Ya lo tienes! No hay nada más que hacer aquí.</p>
              : (<>
                  <p style={ms.criterioValorGrande}>{restantes} {criterio.unidad} restantes</p>
                  <p style={ms.criterioDesc}>{criterio.reto}</p>
                </>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────
export default function Logros() {
  const navigate = useNavigate()
  const { datos, cargando } = useGamification()
  const [seleccionado, setSeleccionado] = useState(null)

  const logros        = datos?.logros || []
  const mapa          = new Map(logros.map(l => [l.tipo, l]))
  const conseguidos   = mapa.size
  const totalLogros   = ORDEN.length
  const pctGlobal     = Math.round((conseguidos / totalLogros) * 100)

  return (
    <div style={s.pagina}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .pg-back:hover { color:#fff; background:rgba(255,255,255,0.08); }
        .pg-badge { transition: transform 160ms cubic-bezier(.2,.7,.2,1), box-shadow 160ms; }
        .pg-badge:hover { transform: translateY(-3px); }
        .pg-badge:active { transform: scale(0.98); }
      `}</style>

      {/* Cabecera */}
      <header style={s.header}>
        <button className="pg-back" style={s.btnVolver} onClick={() => navigate(-1)} aria-label="Volver">
          <span style={{ display: 'flex', transform: 'scaleX(-1)' }}><Iconos.arrow width={20} height={20} /></span>
        </button>
        <h1 style={s.tituloPagina}>Mis Logros</h1>
      </header>

      {/* Progreso global */}
      <div style={s.progresoGlobal}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={s.trofeoHalo} />
          <div style={s.trofeoWrap}><Iconos.trophy width={30} height={30} /></div>
        </div>
        <div style={s.progresoInfo}>
          <div style={s.progresoFilaTop}>
            <span style={s.progresoTexto}>{conseguidos} / {totalLogros} Desbloqueados</span>
            <span style={s.pctDiscreto}>{pctGlobal}%</span>
          </div>
          <div style={s.barraGlobal}>
            <div style={{ ...s.barraGlobalRelleno, width: `${pctGlobal}%` }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      {cargando ? (
        <div style={s.loadingWrap}><div style={s.spinner} /></div>
      ) : (
        <div style={s.grid}>
          {ORDEN.map(tipo => {
            const badge      = mapa.get(tipo)
            const unlocked   = !!badge
            const meta       = BADGE_META[tipo]
            return (
              <div key={tipo} className="pg-badge"
                style={{ ...s.badge, ...(unlocked ? s.badgeOn : s.badgeOff) }}
                onClick={() => setSeleccionado(tipo)}>

                {unlocked && (
                  <span style={s.checkMedallon}><Iconos.check width={12} height={12} /></span>
                )}

                <BadgeIcon tipo={tipo} size={34} unlocked={unlocked} lock />

                <p style={{ ...s.badgeNombre, color: unlocked ? '#fff' : 'rgba(255,255,255,0.30)' }}>
                  {unlocked ? meta.nombre : '???'}
                </p>
                <p style={{ ...s.badgeFecha, color: unlocked ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)' }}>
                  {unlocked
                    ? `Desbloqueado · ${new Date(badge.desbloqueadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
                    : 'Bloqueado'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {seleccionado && (
        <ModalLogro
          tipo={seleccionado}
          badge={mapa.get(seleccionado)}
          datos={datos}
          onCerrar={() => setSeleccionado(null)}
        />
      )}
    </div>
  )
}

// ── Estilos página ────────────────────────────────────────────────────────────
const s = {
  pagina: { minHeight: '100vh', background: '#0D0D0D', paddingBottom: 'calc(var(--bottom-nav-h, 64px) + 24px)', color: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 14, padding: '22px 20px 0' },
  btnVolver: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'rgba(255,255,255,0.04)', border: 'none',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
    transition: 'color 140ms, background 140ms',
  },
  tituloPagina: {
    fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 700, margin: 0,
    letterSpacing: '3px', textTransform: 'uppercase', color: '#fff',
  },

  progresoGlobal: {
    display: 'flex', alignItems: 'center', gap: 18,
    margin: '20px 16px 0', padding: '20px 22px', borderRadius: 18,
    background: 'linear-gradient(180deg, #1B1B1B, #161616)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  trofeoHalo: {
    position: 'absolute', inset: '-10%',
    background: 'radial-gradient(circle at 50% 42%, rgba(230,57,70,0.40), transparent 70%)',
    filter: 'blur(9px)',
  },
  trofeoWrap: {
    position: 'relative', width: 56, height: 56, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, rgba(230,57,70,0.20), rgba(230,57,70,0.05))',
    boxShadow: 'inset 0 0 0 1px rgba(230,57,70,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
    color: RED_SOFT,
  },
  progresoInfo: { flex: 1, minWidth: 0 },
  progresoFilaTop: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  progresoTexto: {
    fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600,
    letterSpacing: '1.4px', textTransform: 'uppercase', whiteSpace: 'nowrap',
    color: 'rgba(255,255,255,0.82)',
  },
  pctDiscreto: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.40)', flexShrink: 0 },
  barraGlobal: { height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' },
  barraGlobalRelleno: {
    height: '100%', borderRadius: 99,
    background: `linear-gradient(90deg, ${RED}, ${RED_SOFT})`,
    boxShadow: '0 0 10px rgba(230,57,70,0.5)', transition: 'width 0.8s ease',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, padding: '24px 16px' },
  badge: {
    position: 'relative', borderRadius: 18, padding: '26px 14px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    cursor: 'pointer', background: '#1A1A1A',
  },
  badgeOn: { boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(230,57,70,0.22), 0 0 22px rgba(230,57,70,0.10)' },
  badgeOff: { boxShadow: '0 6px 18px rgba(0,0,0,0.35)' },
  checkMedallon: {
    position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `linear-gradient(160deg, ${RED}, ${RED_SOFT})`,
    boxShadow: '0 2px 8px rgba(230,57,70,0.45), inset 0 1px 0 rgba(255,255,255,0.3)', color: '#fff',
  },
  badgeNombre: {
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5, textAlign: 'center',
    margin: 0, lineHeight: 1.25, minHeight: '2.5em',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badgeFecha: { fontFamily: "'Inter', sans-serif", fontSize: 10.5, margin: 0, textAlign: 'center', letterSpacing: '0.3px' },

  loadingWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' },
  spinner: { width: 32, height: 32, border: `3px solid ${RED}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
}

// ── Estilos modal ─────────────────────────────────────────────────────────────
const ms = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 200,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  modal: {
    width: '100%', maxWidth: 500, background: '#161616', borderRadius: '22px 22px 0 0',
    padding: '28px 20px 44px', position: 'relative',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.65)',
    border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none',
    maxHeight: '88vh', overflowY: 'auto',
  },
  cerrar: {
    position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)',
    borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  },
  encabezado: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22, paddingTop: 4 },
  titulo: { fontFamily: "'Oswald', sans-serif", fontSize: 19, fontWeight: 700, margin: '4px 0 0', letterSpacing: '2px', color: '#fff', textAlign: 'center' },
  desc: { fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' },
  fechaChip: {
    fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: RED_SOFT,
    background: 'rgba(230,57,70,0.10)', border: '1px solid rgba(230,57,70,0.28)',
    borderRadius: 99, padding: '4px 12px', marginTop: 2,
  },
  bloqueadoChip: {
    fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: 'rgba(255,255,255,0.38)',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 99, padding: '4px 12px', marginTop: 2,
  },
  progresoSeccion: { marginBottom: 18 },
  progresoFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progresoLabel: { fontFamily: "'Oswald', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' },
  progresoValor: { fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' },
  barraFondo: { height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
  pctTexto: { fontFamily: "'Inter', sans-serif", fontSize: 10.5, color: 'rgba(255,255,255,0.30)', margin: '6px 0 0', textAlign: 'right' },
  retoBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '13px 16px', marginBottom: 16 },
  retoTexto: { fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.60)', margin: 0, lineHeight: 1.55, textAlign: 'center' },
  criteriosGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  criterioBloque: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 13px' },
  criterioTitulo: { fontFamily: "'Oswald', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '1px', color: 'rgba(255,255,255,0.38)', margin: '0 0 8px 0', textTransform: 'uppercase' },
  criterioValorGrande: { fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 5px 0', lineHeight: 1.2 },
  criterioDesc: { fontFamily: "'Inter', sans-serif", fontSize: 10.5, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.45 },
}
