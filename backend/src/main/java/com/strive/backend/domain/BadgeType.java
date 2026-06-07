package com.strive.backend.domain;

public enum BadgeType {
    // ── Sesiones ─────────────────────────────────────────────────────────────
    FIRST_SESSION,   // 1 sesión completada
    SESSIONS_5,      // 5 sesiones
    SESSIONS_10,     // 10 sesiones
    SESSIONS_25,     // 25 sesiones
    SESSIONS_50,     // 50 sesiones
    // ── Rachas ───────────────────────────────────────────────────────────────
    STREAK_3,        // 3 días seguidos
    STREAK_7,        // 7 días seguidos
    STREAK_30,       // 30 días seguidos
    // ── Rutinas ──────────────────────────────────────────────────────────────
    FIRST_ROUTINE,   // Primera rutina creada
    ROUTINES_5,      // 5 rutinas creadas
    // ── Social ───────────────────────────────────────────────────────────────
    FIRST_FRIEND,    // Primer amigo añadido
    FIRST_SHARE,     // Primera rutina compartida por chat
}
