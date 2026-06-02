package com.strive.backend.dto;

import java.time.LocalDateTime;

public record ConversationDto(
        Long id,
        FriendUserDto otherUser,
        LocalDateTime lastMessageAt,
        long unreadCount,
        LocalDateTime createdAt
) {}
