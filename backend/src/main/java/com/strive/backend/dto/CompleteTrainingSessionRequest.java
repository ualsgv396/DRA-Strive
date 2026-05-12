package com.strive.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CompleteTrainingSessionRequest(
        @NotNull @Min(1) @Max(600) Integer durationMinutes,
        @Size(max = 500) String notes,
        @Valid List<ExerciseRecordRequest> exercises
) {
}
