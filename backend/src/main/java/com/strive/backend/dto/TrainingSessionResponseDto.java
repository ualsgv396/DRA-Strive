package com.strive.backend.dto;

import com.strive.backend.domain.TrainingExerciseRecord;
import java.time.LocalDateTime;
import java.util.List;

public record TrainingSessionResponseDto(
        Long id,
        Long routineId,
        String routineName,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        Integer durationMinutes,
        String status,
        String notes,
        List<TrainingExerciseRecord> exercises,
        // Solo se rellena al completar una sesión; null en el resto de endpoints.
        // El frontend lo usa para mostrar toasts de nuevos logros desbloqueados.
        List<BadgeDto> newBadges
) {}
