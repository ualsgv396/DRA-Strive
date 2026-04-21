package com.strive.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RoutineExerciseRequest(
        @NotNull Long exerciseId,
        @NotNull @Min(1) Integer sets,
        @NotNull @Min(1) Integer reps,
        @NotNull @Min(0) Integer sortOrder
) {
}
