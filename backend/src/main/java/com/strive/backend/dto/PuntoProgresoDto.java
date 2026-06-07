package com.strive.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Un punto en la serie temporal de un ejercicio.
 *
 * cargaMaxima  — carga más alta registrada en esa sesión para el ejercicio.
 *               Null si el ejercicio no usa carga (bodyweight).
 * esPR         — true cuando la carga supera cualquier registro anterior.
 */
public record PuntoProgresoDto(
    LocalDate   fecha,
    BigDecimal  cargaMaxima,
    Integer     repeticiones,
    Integer     series,
    String      unidadCarga,
    boolean     esPR
) {}
