package com.strive.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Serie temporal completa de un ejercicio + metadata del récord personal. */
public record ResumenProgresoDto(
    Long              exerciseId,
    String            nombre,
    String            unidadCarga,      // KG | REPS | SECONDS | MINUTES
    List<PuntoProgresoDto> puntos,
    BigDecimal        recordPersonal,
    LocalDate         fechaRecord,
    int               totalSesiones
) {}
