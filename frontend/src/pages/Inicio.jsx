import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResponsive, useMediaQuery } from '../hooks/useMediaQuery'

const funcionalidades = [
  { icono: '💪', titulo: 'Más de 200 ejercicios',   descripcion: 'Catálogo completo para culturistas, atletas, futbolistas y principiantes.' },
  { icono: '📋', titulo: 'Rutinas personalizadas',   descripcion: 'Elige ejercicios, ajusta series y repeticiones y organiza tu semana.' },
  { icono: '📤', titulo: 'Comparte por QR',          descripcion: 'Genera un código QR o enlace para compartir tu rutina al instante.' },
  { icono: '📄', titulo: 'Exporta en PDF',           descripcion: 'Descarga tu rutina en PDF lista para imprimir y llevar al gimnasio.' },
  { icono: '🤖', titulo: 'Flash Training con IA',    descripcion: 'Responde 4 preguntas y la IA genera un entrenamiento personalizado al instante.' },
  { icono: '📅', titulo: 'Planificación semanal',    descripcion: 'Organiza tus entrenamientos según tu calendario y disponibilidad.' },
]

export default function Inicio() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const isSmall = useMediaQuery('(max-width: 480px)')
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Cierra el menú cuando se navega
  const ir = (ruta) => { setMenuAbierto(false); navigate(ruta) }

  // ── Valores responsivos calculados ──
  const heroFontSize   = isSmall ? '40px' : isMobile ? '52px' : '72px'
  const heroPadding    = isMobile ? '52px 20px 40px' : '80px 60px'
  const seccionPadding = isMobile ? '60px 20px' : '80px 60px'
  const ctaPadding     = isMobile ? '60px 20px' : '100px 60px'
  const gridCols       = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)'
  const ctaFontSize    = isMobile ? '36px' : '52px'
  const navPadding     = isMobile ? '16px 20px' : '20px 60px'

  return (
    <div style={s.contenedor}>

      {/* ── NAVBAR ── */}
      <nav style={{ ...s.navbar, padding: navPadding }}>
        <span style={s.logo}>STRIVE</span>

        {/* Desktop: botones directos */}
        {!isMobile && (
          <div style={s.navBotones}>
            <button style={s.botonSecundario} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <button style={s.botonPrimario} onClick={() => navigate('/registro')}>
              Empezar gratis
            </button>
          </div>
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <button
            style={s.hamburger}
            onClick={() => setMenuAbierto(v => !v)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
          >
            <span style={s.hamburgerIcon}>{menuAbierto ? '✕' : '☰'}</span>
          </button>
        )}
      </nav>

      {/* Mobile: menú desplegable */}
      {isMobile && menuAbierto && (
        <div style={s.menuMobile}>
          <button style={{ ...s.botonPrimario, width: '100%' }} onClick={() => ir('/registro')}>
            Empezar gratis
          </button>
          <button style={{ ...s.botonSecundario, width: '100%' }} onClick={() => ir('/login')}>
            Iniciar sesión
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        ...s.hero,
        flexDirection: isMobile ? 'column' : 'row',
        padding: heroPadding,
        textAlign: isMobile ? 'center' : 'left',
        minHeight: isMobile ? 'auto' : '85vh',
      }}>
        <div style={{ ...s.heroContenido, alignItems: isMobile ? 'center' : 'flex-start' }}>
          <span style={s.etiqueta}>ENTRENAMIENTO INTELIGENTE</span>
          <h1 style={{ ...s.heroTitulo, fontSize: heroFontSize }}>
            Crea tu rutina.<br />
            <span style={s.heroDestacado}>Supera tus límites.</span>
          </h1>
          <p style={{ ...s.heroSubtitulo, fontSize: isMobile ? '16px' : '18px', maxWidth: isMobile ? '100%' : '480px' }}>
            Diseña entrenamientos personalizados con más de 200 ejercicios
            para todo tipo de atleta. Comparte, exporta y mejora cada día.
          </p>
          <div style={{ ...s.heroBotones, flexDirection: isSmall ? 'column' : 'row', width: isSmall ? '100%' : 'auto' }}>
            <button style={{ ...s.botonGrande, width: isSmall ? '100%' : 'auto' }} onClick={() => navigate('/registro')}>
              Crear mi rutina
            </button>
            <button style={{ ...s.botonGrandeSecundario, width: isSmall ? '100%' : 'auto' }} onClick={() => navigate('/login')}>
              Ver demo
            </button>
          </div>
        </div>

        {/* La tarjeta decorativa se oculta en móviles pequeños */}
        {!isSmall && (
          <div style={{ ...s.heroImagen, marginTop: isMobile ? '32px' : 0 }}>
            <div style={{ ...s.tarjetaFlotante, width: isMobile ? '100%' : '320px' }}>
              {[
                'Press de banca — 4×8',
                'Sentadilla — 3×12',
                'Peso muerto — 4×6',
              ].map((t, i) => (
                <div key={i} style={{ ...s.tarjetaLinea, opacity: i === 2 ? 0.55 : 1 }}>
                  <span style={s.tarjetaPunto} />
                  <span style={s.tarjetaTexto}>{t}</span>
                </div>
              ))}
              <div style={{ ...s.tarjetaLinea, opacity: 0.3 }}>
                <span style={s.tarjetaPunto} />
                <span style={s.tarjetaTexto}>Dominadas — 3×10</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section style={{ ...s.caracteristicas, padding: seccionPadding }}>
        <h2 style={{ ...s.seccionTitulo, fontSize: isMobile ? '32px' : '42px' }}>
          Todo lo que necesitas
        </h2>
        <div style={{ ...s.grid, gridTemplateColumns: gridCols, gap: isMobile ? '16px' : '24px' }}>
          {funcionalidades.map((f, i) => (
            <div key={i} style={s.tarjetaFeature}>
              <span style={s.icono} aria-hidden="true">{f.icono}</span>
              <h3 style={s.featureTitulo}>{f.titulo}</h3>
              <p style={s.featureTexto}>{f.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ ...s.ctaFinal, padding: ctaPadding }}>
        <h2 style={{ ...s.ctaTitulo, fontSize: ctaFontSize }}>¿Listo para empezar?</h2>
        <p style={{ ...s.ctaSubtitulo, fontSize: isMobile ? '16px' : '18px' }}>
          Únete y construye el entrenamiento que mereces.
        </p>
        <button
          style={{ ...s.botonGrande, width: isMobile ? '100%' : 'auto' }}
          onClick={() => navigate('/registro')}
        >
          Crear cuenta gratis
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        ...s.footer,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : 0,
        textAlign: isMobile ? 'center' : 'left',
        padding: isMobile ? '24px 20px' : '32px 60px',
      }}>
        <span style={s.logo}>STRIVE</span>
        <p style={s.footerTexto}>© 2026 Strive. Todos los derechos reservados.</p>
      </footer>

    </div>
  )
}

// ── Estilos base (mobile-first donde es posible) ──────────────────────────────
const s = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    overflowX: 'hidden',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(13,13,13,0.95)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '26px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E63946',
    letterSpacing: '2px',
    userSelect: 'none',
  },
  navBotones: { display: 'flex', gap: '12px' },
  botonPrimario: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    minHeight: '44px',
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.25)',
    padding: '11px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    minHeight: '44px',
  },
  hamburger: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    width: '44px',
    height: '44px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    color: '#fff',
    fontSize: '18px',
    lineHeight: 1,
    pointerEvents: 'none',
  },
  menuMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#111',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    animation: 'slideUp 0.2s ease',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '32px',
  },
  heroContenido: {
    flex: 1,
    maxWidth: '580px',
    display: 'flex',
    flexDirection: 'column',
  },
  etiqueta: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    color: '#E63946',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    display: 'inline-block',
    marginBottom: '20px',
    alignSelf: 'flex-start',
  },
  heroTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '700',
    lineHeight: '1.05',
    marginBottom: '20px',
    textTransform: 'uppercase',
  },
  heroDestacado: { color: '#E63946' },
  heroSubtitulo: {
    color: 'rgba(255,255,255,0.62)',
    lineHeight: '1.7',
    marginBottom: '36px',
  },
  heroBotones: { display: 'flex', gap: '12px' },
  botonGrande: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '15px 32px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    minHeight: '50px',
  },
  botonGrandeSecundario: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.25)',
    padding: '15px 32px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    minHeight: '50px',
  },
  heroImagen: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarjetaFlotante: {
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(230, 57, 70, 0.3)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 20px 60px rgba(230, 57, 70, 0.12)',
    maxWidth: '320px',
  },
  tarjetaLinea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  tarjetaPunto: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#E63946',
    flexShrink: 0,
  },
  tarjetaTexto: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  caracteristicas: {
    backgroundColor: '#111111',
  },
  seccionTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '48px',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  tarjetaFeature: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    padding: '28px',
    borderLeft: '4px solid #E63946',
  },
  icono: {
    fontSize: '28px',
    display: 'block',
    marginBottom: '14px',
  },
  featureTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  featureTexto: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.58)',
    lineHeight: '1.6',
  },
  ctaFinal: {
    textAlign: 'center',
    backgroundColor: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  ctaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '700',
    textTransform: 'uppercase',
    margin: 0,
  },
  ctaSubtitulo: {
    color: 'rgba(255,255,255,0.58)',
    margin: 0,
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTexto: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.38)',
    margin: 0,
  },
}
