package com.strive.backend.exception;

public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException() {
        super("No tienes permiso para realizar esta acción");
    }
}
