package com.strive.backend.dto;

import java.time.LocalDateTime;

public record FriendInviteDto(
        String token,
        String inviteUrl,
        String qrImageBase64,
        LocalDateTime expiresAt
) {
}
