import { useNavigate } from 'react-router-dom'

export default function Inicio() {
  const navigate = useNavigate()

  return (
    <div style={estilos.contenedor}>

      {/* NAVBAR */}
      <nav style={estilos.navbar}>
        <span style={estilos.logo}>STRIVE</span>
        <div style={estilos.navBotones}>
          <button style={estilos.botonSecundario} onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
          <button style={estilos.botonPrimario} onClick={() => navigate('/registro')}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={estilos.hero}>
        <div style={estilos.heroContenido}>
          <span style={estilos.etiqueta}>ENTRENAMIENTO INTELIGENTE</span>
          <h1 style={estilos.heroTitulo}>
            Crea tu rutina.<br />
            <span style={estilos.heroDestacado}>Supera tus límites.</span>
          </h1>
          <p style={estilos.heroSubtitulo}>
            Diseña entrenamientos personalizados con más de 200 ejercicios
            para todo tipo de atleta. Comparte, exporta y mejora cada día.
          </p>
          <div style={estilos.heroBotones}>
            <button style={estilos.botonGrande} onClick={() => navigate('/registro')}>
              Crear mi rutina
            </button>
            <button style={estilos.botonGrandeSecundario} onClick={() => navigate('/login')}>
              Ver demo
            </button>
          </div>
        </div>
        <div style={estilos.heroImagen}>
          <div style={estilos.tarjetaFlotante}>
            <div style={estilos.tarjetaLinea}>
              <span style={estilos.tarjetaPunto}></span>
              <span style={estilos.tarjetaTexto}>Press de banca — 4×8</span>
            </div>
            <div style={estilos.tarjetaLinea}>
              <span style={estilos.tarjetaPunto}></span>
              <span style={estilos.tarjetaTexto}>Sentadilla — 3×12</span>
            </div>
            <div style={estilos.tarjetaLinea}>
              <span style={estilos.tarjetaPunto}></span>
              <span style={estilos.tarjetaTexto}>Peso muerto — 4×6</span>
            </div>
            <div style={{ ...estilos.tarjetaLinea, opacity: 0.5 }}>
              <span style={estilos.tarjetaPunto}></span>
              <span style={estilos.tarjetaTexto}>Dominadas — 3×10</span>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section style={estilos.caracteristicas}>
        <h2 style={estilos.seccionTitulo}>Todo lo que necesitas</h2>
        <div style={estilos.grid}>
          {funcionalidades.map((f, i) => (
            <div key={i} style={estilos.tarjetaFeature}>
              <span style={estilos.icono}>{f.icono}</span>
              <h3 style={estilos.featureTitulo}>{f.titulo}</h3>
              <p style={estilos.featureTexto}>{f.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={estilos.ctaFinal}>
        <h2 style={estilos.ctaTitulo}>¿Listo para empezar?</h2>
        <p style={estilos.ctaSubtitulo}>Únete y construye el entrenamiento que mereces.</p>
        <button style={estilos.botonGrande} onClick={() => navigate('/registro')}>
          Crear cuenta gratis
        </button>
      </section>

      {/* FOOTER */}
      <footer style={estilos.footer}>
        <span style={estilos.logo}>STRIVE</span>
        <p style={estilos.footerTexto}>© 2026 Strive. Todos los derechos reservados.</p>
      </footer>

    </div>
  )
}

const funcionalidades = [
  {
    icono: '💪',
    titulo: 'Más de 200 ejercicios',
    descripcion: 'Catálogo completo para culturistas, atletas, futbolistas y principiantes.'
  },
  {
    icono: '📋',
    titulo: 'Rutinas personalizadas',
    descripcion: 'Elige ejercicios, ajusta series y repeticiones y organiza tu semana.'
  },
  {
    icono: '📤',
    titulo: 'Comparte por QR',
    descripcion: 'Genera un código QR o enlace para compartir tu rutina al instante.'
  },
  {
    icono: '📄',
    titulo: 'Exporta en PDF',
    descripcion: 'Descarga tu rutina en PDF lista para imprimir y llevar al gimnasio.'
  },
  {
    icono: '🤖',
    titulo: 'Rutinas con IA',
    descripcion: 'Dinos tu objetivo y nivel, y la IA diseñará tu plan de entrenamiento.'
  },
  {
    icono: '📅',
    titulo: 'Planificación semanal',
    descripcion: 'Organiza tus entrenamientos según tu calendario y disponibilidad.'
  }
]

const estilos = {
  contenedor: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif"
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 60px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  logo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#E63946',
    letterSpacing: '2px'
  },
  navBotones: {
    display: 'flex',
    gap: '12px'
  },
  botonPrimario: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.3)',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '80px 60px',
    minHeight: '85vh',
    gap: '40px'
  },
  heroContenido: {
    flex: 1,
    maxWidth: '580px'
  },
  etiqueta: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    color: '#E63946',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    display: 'inline-block',
    marginBottom: '24px'
  },
  heroTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '72px',
    fontWeight: '700',
    lineHeight: '1.05',
    marginBottom: '24px',
    textTransform: 'uppercase'
  },
  heroDestacado: {
    color: '#E63946'
  },
  heroSubtitulo: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: '1.7',
    marginBottom: '40px',
    maxWidth: '480px'
  },
  heroBotones: {
    display: 'flex',
    gap: '16px'
  },
  botonGrande: {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: 'none',
    padding: '16px 36px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  botonGrandeSecundario: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.3)',
    padding: '16px 36px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: "'Oswald', sans-serif",
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  heroImagen: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tarjetaFlotante: {
    backgroundColor: '#1A1A1A',
    border: '1px solid rgba(230, 57, 70, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    width: '320px',
    boxShadow: '0 20px 60px rgba(230, 57, 70, 0.15)'
  },
  tarjetaLinea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  tarjetaPunto: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#E63946',
    flexShrink: 0
  },
  tarjetaTexto: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500'
  },
  caracteristicas: {
    padding: '80px 60px',
    backgroundColor: '#111111'
  },
  seccionTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '42px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '56px',
    textTransform: 'uppercase'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  tarjetaFeature: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    padding: '32px',
    borderLeft: '4px solid #E63946'
  },
  icono: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '16px'
  },
  featureTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '10px',
    textTransform: 'uppercase'
  },
  featureTexto: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: '1.6'
  },
  ctaFinal: {
    padding: '100px 60px',
    textAlign: 'center',
    backgroundColor: '#0D0D0D'
  },
  ctaTitulo: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: '52px',
    fontWeight: '700',
    marginBottom: '16px',
    textTransform: 'uppercase'
  },
  ctaSubtitulo: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '40px'
  },
  footer: {
    padding: '32px 60px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerTexto: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)'
  }
}