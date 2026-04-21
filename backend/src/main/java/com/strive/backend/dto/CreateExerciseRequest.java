package com.strive.backend.dto;

import com.strive.backend.domain.ExerciseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateExerciseRequest(
        @NotBlank String title,
        @NotBlank String imageUrl,
        @NotNull ExerciseType type,
        String description
) {
}
