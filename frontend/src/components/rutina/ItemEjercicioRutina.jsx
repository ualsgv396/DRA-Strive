import { useState } from 'react'

export default function ItemEjercicioRutina({
  routineExercise,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const [confirmando, setConfirmando] = useState(false)
  const { exercise } = routineExercise

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center gap-4 p-4">

        {/* Número */}
        <span className="font-['Oswald'] text-2xl font-bold text-[#E63946]/40 w-8 flex-shrink-0 text-center">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Imagen */}
        <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {exercise?.imageUrl
            ? <img src={exercise.imageUrl} alt={exercise.title} className="w-full h-full object-cover" />
            : <span className="text-2xl">💪</span>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-['Oswald'] font-semibold uppercase leading-tight truncate">
            {exercise?.title}
          </h3>
          <p className="text-white/40 text-xs">{(exercise?.muscleGroups ?? []).join(', ')}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-3 items-center flex-shrink-0 text-center">
          <div>
            <p className="font-['Oswald'] text-xl font-bold">{routineExercise.sets}</p>
            <p className="text-white/40 text-xs">Series</p>
          </div>
          <span className="text-white/20">×</span>
          <div>
            <p className="font-['Oswald'] text-xl font-bold">{routineExercise.reps}</p>
            <p className="text-white/40 text-xs">{exercise?.type === 'CARDIO' ? 'Interv.' : 'Reps'}</p>
          </div>
          {routineExercise.loadValue != null && (
            <>
              <span className="text-white/20">·</span>
              <div>
                <p className="font-['Oswald'] text-xl font-bold">{routineExercise.loadValue}</p>
                <p className="text-white/40 text-xs">{routineExercise.loadUnit}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      {!confirmando ? (
        <div className="flex border-t border-white/5">
          <button
            onClick={() => onMoveUp(routineExercise)}
            disabled={index === 0}
            className="flex-1 py-2 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm"
            title="Mover arriba"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(routineExercise)}
            disabled={index === total - 1}
            className="flex-1 py-2 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm"
            title="Mover abajo"
          >
            ↓
          </button>
          <button
            onClick={() => onEdit(routineExercise)}
            className="flex-1 py-2 text-white/50 hover:text-[#E63946] transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            Editar
          </button>
          <button
            onClick={() => setConfirmando(true)}
            className="flex-1 py-2 text-white/30 hover:text-[#E63946] transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-t border-white/5 px-4 py-2">
          <span className="text-white/50 text-xs flex-1">¿Eliminar este ejercicio?</span>
          <button
            onClick={() => setConfirmando(false)}
            className="text-white/40 text-xs hover:text-white transition-colors px-3 py-1"
          >
            No
          </button>
          <button
            onClick={() => { setConfirmando(false); onDelete(routineExercise.id) }}
            className="bg-[#E63946] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-[#C1121F] transition-colors"
          >
            Sí, eliminar
          </button>
        </div>
      )}
    </div>
  )
}
