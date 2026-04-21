package com.strive.backend.auth;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String email,
        String fullName,
        String role
) {
}
