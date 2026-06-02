package com.strive.backend.dto;

import com.strive.backend.domain.MessageType;
import java.time.LocalDateTime;

public record MessageDto(
        Long id,
        Long conversationId,
        Long senderId,
        String senderEmail,
        String senderFullName,
        String content,
        MessageType type,
        Long routineId,
        String routineNameSnapshot,
        boolean isRead,
        LocalDateTime sentAt
) {}
