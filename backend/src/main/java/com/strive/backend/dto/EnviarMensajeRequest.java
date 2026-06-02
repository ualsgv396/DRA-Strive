package com.strive.backend.dto;

import com.strive.backend.domain.MessageType;

/**
 * Payload que el cliente envía al endpoint STOMP /app/chat.send.
 *
 * Campos:
 *   conversationId       — ID de la conversación (obligatorio)
 *   content              — texto del mensaje (obligatorio; vacío si type=ROUTINE sin nota)
 *   type                 — TEXT (default) | ROUTINE
 *   routineId            — solo cuando type=ROUTINE
 *   routineNameSnapshot  — nombre de la rutina en el momento del envío (para tolerancia a borrado)
 */
public record EnviarMensajeRequest(
        Long conversationId,
        String content,
        MessageType type,
        Long routineId,
        String routineNameSnapshot
) {}
