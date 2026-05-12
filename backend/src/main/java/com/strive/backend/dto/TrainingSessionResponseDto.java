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
        List<TrainingExerciseRecord> exercises
) {
}
