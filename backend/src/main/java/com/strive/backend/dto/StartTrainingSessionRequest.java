package com.strive.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StartTrainingSessionRequest(
        @NotNull Long routineId,
        @Size(max = 500) String notes
) {
}
