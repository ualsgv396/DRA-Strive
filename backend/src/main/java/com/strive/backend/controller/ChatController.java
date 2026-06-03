package com.strive.backend.controller;

import com.strive.backend.dto.ConversationDto;
import com.strive.backend.dto.MessageDto;
import com.strive.backend.service.ChatService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Lista todas las conversaciones del usuario autenticado,
     * ordenadas por actividad reciente e incluyendo el conteo de no leídos.
     */
    @GetMapping("/conversations")
    public List<ConversationDto> listarConversaciones() {
        return chatService.listarConversaciones();
    }

    /**
     * Crea la conversación con el amigo indicado si no existe,
     * o devuelve la existente. Requiere amistad aceptada.
     */
    @PostMapping("/conversations/{amigoId}")
    public ConversationDto obtenerOCrear(@PathVariable Long amigoId) {
        return chatService.obtenerOCrearConversacion(amigoId);
    }

    /**
     * Historial paginado de mensajes de una conversación.
     * Devuelve los mensajes en orden cronológico ascendente
     * (del más antiguo al más reciente).
     *
     * @param page  Página (0-based). Default: 0.
     * @param size  Mensajes por página. Default: 30.
     */
    @GetMapping("/conversations/{id}/messages")
    public List<MessageDto> listarMensajes(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return chatService.listarMensajes(id, page, size);
    }

    /**
     * Marca como leídos todos los mensajes no leídos de una conversación
     * para el usuario autenticado. Se llama cuando el usuario abre el chat.
     */
    @PatchMapping("/conversations/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarLeidos(@PathVariable Long id) {
        chatService.marcarLeidos(id);
    }

    /**
     * Total de mensajes no leídos en todas las conversaciones del usuario.
     * Usado para el badge de notificaciones global en el frontend.
     */
    @GetMapping("/unread")
    public Map<String, Long> totalSinLeer() {
        return Map.of("unread", chatService.totalSinLeer());
    }
}
