package com.strive.backend.dto;

import com.strive.backend.domain.BadgeType;
import java.time.LocalDateTime;

public record BadgeDto(BadgeType tipo, LocalDateTime desbloqueadoEn) {}
