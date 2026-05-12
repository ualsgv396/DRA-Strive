package com.strive.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateRoutineExerciseRequest(
        @NotNull @Min(1) @Max(20) Integer sets,
        @NotNull @Min(1) @Max(999) Integer reps,
        @DecimalMin("0") Double loadValue,
        String loadUnit
) {
}
