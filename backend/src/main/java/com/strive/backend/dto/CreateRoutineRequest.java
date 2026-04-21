package com.strive.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateRoutineRequest(
        @NotBlank String name,
        String goal,
        @NotNull Long ownerId,
        @NotEmpty List<@Valid RoutineExerciseRequest> exercises
) {
}
