import { useState, useEffect } from 'react'

/**
 * Escucha un media query y retorna si coincide.
 * Se suscribe a cambios de ventana, limpia el listener al desmontar.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Sistema de breakpoints consistente:
 *   sm  < 640px   (teléfonos pequeños)
 *   md  < 768px   (teléfonos grandes)
 *   lg  < 1024px  (tablets)
 *   xl  ≥ 1024px  (escritorio)
 *
 * Uso:
 *   const { isMobile, isTablet, isDesktop } = useResponsive()
 */
export function useResponsive() {
  const isMobile  = useMediaQuery('(max-width: 767px)')
  const isTablet  = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    /** true en teléfonos y tablets */
    isCompact: isMobile || isTablet,
  }
}
