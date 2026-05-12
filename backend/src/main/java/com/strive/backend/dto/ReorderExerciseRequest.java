package com.strive.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReorderExerciseRequest(
        @NotNull Long routineExerciseId,
        @NotNull @Min(0) Integer sortOrder
) {
}
