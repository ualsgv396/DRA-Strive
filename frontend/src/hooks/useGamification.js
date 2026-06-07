import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export const BADGE_META = {
  FIRST_SESSION:  { nombre: 'Primera Gota',       icono: '🏋️', desc: 'Completaste tu primera sesión' },
  SESSIONS_5:     { nombre: 'En Racha',            icono: '🔥', desc: '5 sesiones completadas' },
  SESSIONS_10:    { nombre: 'Constante',           icono: '💪', desc: '10 sesiones completadas' },
  SESSIONS_25:    { nombre: 'Dedicado',            icono: '⚡', desc: '25 sesiones completadas' },
  SESSIONS_50:    { nombre: 'Élite',               icono: '🏆', desc: '50 sesiones completadas' },
  STREAK_3:       { nombre: 'Trío de Fuego',       icono: '🔥', desc: '3 días seguidos entrenando' },
  STREAK_7:       { nombre: 'Semana Perfecta',     icono: '📅', desc: '7 días seguidos entrenando' },
  STREAK_30:      { nombre: 'Máquina del Mes',     icono: '🗓️', desc: '30 días seguidos entrenando' },
  FIRST_ROUTINE:  { nombre: 'Arquitecto',          icono: '📋', desc: 'Creaste tu primera rutina' },
  ROUTINES_5:     { nombre: 'Coleccionista',       icono: '📚', desc: '5 rutinas creadas' },
  FIRST_FRIEND:   { nombre: 'No Entreno Solo',     icono: '🤝', desc: 'Añadiste tu primer amigo' },
  FIRST_SHARE:    { nombre: 'Generoso',            icono: '↗️', desc: 'Compartiste tu primera rutina' },
}

export function useGamification() {
  const [datos, setDatos]       = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/gamification/me')
      setDatos(data)
    } catch {
      // silencioso: la gamificación no es crítica
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { datos, cargando, recargar: cargar }
}
