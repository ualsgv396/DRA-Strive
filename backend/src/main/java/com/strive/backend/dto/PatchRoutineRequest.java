package com.strive.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record PatchRoutineRequest(
        @NotBlank String name,
        String goal
) {}
