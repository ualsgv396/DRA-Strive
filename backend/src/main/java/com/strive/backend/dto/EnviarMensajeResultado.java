package com.strive.backend.dto;

/**
 * Retorno de ChatService.procesarMensajeWs().
 * Agrupa el mensaje persistido y el email del destinatario en una sola
 * operación para evitar queries adicionales en el WebSocket controller.
 */
public record EnviarMensajeResultado(
        MessageDto mensaje,
        String emailDestinatario
) {}
