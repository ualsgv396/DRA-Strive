package com.strive.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ExerciseRecordRequest(
        @NotNull Long routineExerciseId,
        @NotNull @Min(1) Integer setsCompleted,
        @NotNull @Min(1) Integer repsCompleted,
        @DecimalMin("0") BigDecimal loadCompleted,
        String loadUnit,
        @Size(max = 500) String notes
) {
}
