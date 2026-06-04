package com.strive.backend.dto;

/**
 * Evento de presencia enviado por WebSocket a los amigos de un usuario
 * cuando éste se conecta o desconecta.
 *
 * Se publica en /user/{email}/queue/presence (destino privado por amigo),
 * de modo que solo los amigos del usuario reciben su cambio de estado.
 */
public record PresenceEventDto(
        Long userId,
        String fullName,
        boolean online
) {}
