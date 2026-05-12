package com.strive.backend.dto;

import jakarta.validation.constraints.NotNull;

public record CreateFriendRequestDto(
        @NotNull Long targetUserId
) {
}
