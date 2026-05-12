import { useMemo } from 'react'

/**
 * Agrega estadísticas de todas las rutinas del usuario.
 * Recibe el array de rutinas (con routineExercises expandidos) y
 * devuelve totales y el mapa de actividad por fecha para el heatmap.
 */
export default function useProfileStats(rutinas = []) {
  return useMemo(() => {
    let totalEjercicios = 0
    let totalSeries     = 0
    let totalReps       = 0
    const tipoCount     = {}

    for (const rutina of rutinas) {
      for (const re of (rutina.routineExercises ?? [])) {
        totalEjercicios++
        const sets = re.sets ?? 0
        const reps = re.reps ?? 0
        totalSeries += sets
        totalReps   += sets * reps

        const tipo = re.exercise?.type
        if (tipo) tipoCount[tipo] = (tipoCount[tipo] ?? 0) + 1
      }
    }

    // Mapa { 'YYYY-MM-DD': nº de rutinas creadas ese día }
    const actividadPorFecha = {}
    for (const rutina of rutinas) {
      if (!rutina.createdAt) continue
      const key = new Date(rutina.createdAt).toISOString().split('T')[0]
      actividadPorFecha[key] = (actividadPorFecha[key] ?? 0) + 1
    }

    return {
      totalEjercicios,
      totalSeries,
      totalReps,
      fuerza:    tipoCount['FUERZA']    ?? 0,
      cardio:    tipoCount['CARDIO']    ?? 0,
      movilidad: tipoCount['MOVILIDAD'] ?? 0,
      actividadPorFecha,
    }
  }, [rutinas])
}
