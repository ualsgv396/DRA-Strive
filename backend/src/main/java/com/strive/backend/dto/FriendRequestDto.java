package com.strive.backend.dto;

import java.time.LocalDateTime;

public record FriendRequestDto(
        Long requestId,
        FriendUserDto fromUser,
        LocalDateTime createdAt
) {
}
