package com.strive.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddExerciseToRoutineRequest(
        @NotNull Long exerciseId,
        @Min(1) Integer sets,
        @Min(1) Integer reps,
        Double loadValue,
        String loadUnit
) {
}
