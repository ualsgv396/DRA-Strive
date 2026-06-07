package com.strive.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FeedItemDto(
    Long          sessionId,
    Long          friendId,
    String        friendFullName,
    String        friendNickname,
    String        routineName,
    LocalDateTime completedAt,
    Integer       durationMinutes,
    long          numEjercicios,
    List<ReaccionDto> reacciones
) {}
