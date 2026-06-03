package com.strive.backend.controller;

import com.strive.backend.domain.MessageType;
import com.strive.backend.dto.EnviarMensajeRequest;
import com.strive.backend.dto.EnviarMensajeResultado;
import com.strive.backend.service.ChatService;
import java.security.Principal;
import java.util.Map;
import java.util.Objects;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Controlador STOMP para el chat en tiempo real.
 *
 * El cliente suscribe a:
 *   /user/queue/mensajes  — recibe mensajes nuevos
 *   /user/queue/errores   — recibe errores del servidor
 *
 * El cliente envía a:
 *   /app/chat.send        — enviar un mensaje
 */
@Controller
public class ChatWebSocketController {

    private static final String DESTINO_MENSAJES = "/queue/mensajes";
    private static final String DESTINO_ERRORES  = "/queue/errores";

    private final ChatService            chatService;
    private final SimpMessagingTemplate  messagingTemplate;

    public ChatWebSocketController(ChatService chatService,
                                   SimpMessagingTemplate messagingTemplate) {
        this.chatService       = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Recibe un mensaje desde el cliente, lo persiste y lo distribuye
     * en tiempo real al destinatario y de vuelta al remitente.
     *
     * El Principal ya fue autenticado en el frame CONNECT
     * por JwtChannelInterceptor (Issue 1.2), por lo que aquí
     * nunca llega un usuario no autenticado.
     */
    @MessageMapping("/chat.send")
    public void enviarMensaje(
            @Payload EnviarMensajeRequest request,
            Principal principal) {

        // Validación de payload mínimo
        if (request.conversationId() == null) {
            throw new IllegalArgumentException("conversationId es obligatorio");
        }
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("El mensaje no puede estar vacío");
        }

        String senderEmail = principal.getName();
        MessageType tipo   = request.type() != null ? request.type() : MessageType.TEXT;

        // Persistir + obtener email destinatario en una sola transacción
        EnviarMensajeResultado resultado = chatService.procesarMensajeWs(
            request.conversationId(),
            senderEmail,
            request.content().trim(),
            tipo,
            request.routineId(),
            request.routineNameSnapshot()
        );

        // Entregar al destinatario en tiempo real
        messagingTemplate.convertAndSendToUser(
            Objects.requireNonNull(resultado.emailDestinatario()),
            DESTINO_MENSAJES,
            Objects.requireNonNull(resultado.mensaje())
        );

        // Echo al remitente: confirma persistencia y sincroniza multi-dispositivo
        messagingTemplate.convertAndSendToUser(
            Objects.requireNonNull(senderEmail),
            DESTINO_MENSAJES,
            Objects.requireNonNull(resultado.mensaje())
        );
    }

    /**
     * Captura cualquier excepción lanzada dentro de los @MessageMapping
     * y la reenvía al usuario como un error estructurado.
     *
     * Sin esto, los errores STOMP se perderían silenciosamente en el log
     * y el cliente nunca sabría que algo falló.
     */
    @MessageExceptionHandler
    public void handleException(Principal principal, Exception ex) {
        if (principal == null) return;
        String msg = ex.getMessage() != null ? ex.getMessage() : "Error inesperado";
        messagingTemplate.convertAndSendToUser(
            Objects.requireNonNull(principal.getName()),
            DESTINO_ERRORES,
            Objects.requireNonNull(Map.of("error", msg))
        );
    }
}
