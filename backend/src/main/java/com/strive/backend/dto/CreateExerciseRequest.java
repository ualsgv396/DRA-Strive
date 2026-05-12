package com.strive.backend.dto;

import com.strive.backend.domain.Difficulty;
import com.strive.backend.domain.ExerciseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateExerciseRequest(
        @NotBlank String title,
        String imageUrl,
        @NotNull ExerciseType type,
        String description,
        List<String> muscleGroups,
        Difficulty difficulty
) {
}
