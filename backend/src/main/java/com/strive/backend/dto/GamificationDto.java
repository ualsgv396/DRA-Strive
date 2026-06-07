package com.strive.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record GamificationDto(
    int rachaActual,
    int rachaMasLarga,
    LocalDate ultimoEntreno,
    List<BadgeDto> logros
) {}
