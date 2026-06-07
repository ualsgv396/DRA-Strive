package com.strive.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ToggleReaccionRequest(
    @NotBlank @Size(max = 8) String emoji
) {}
