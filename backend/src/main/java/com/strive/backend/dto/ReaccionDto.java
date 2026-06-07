package com.strive.backend.dto;

/** Conteo de un emoji de reacción en una sesión. */
public record ReaccionDto(String emoji, long count, boolean mia) {}
