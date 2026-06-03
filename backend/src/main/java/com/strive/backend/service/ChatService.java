package com.strive.backend.service;

import com.strive.backend.domain.Conversation;
import com.strive.backend.domain.Message;
import com.strive.backend.domain.MessageType;
import com.strive.backend.domain.User;
import com.strive.backend.dto.ConversationDto;
import com.strive.backend.dto.EnviarMensajeResultado;
import com.strive.backend.dto.FriendUserDto;
import com.strive.backend.dto.MessageDto;
import com.strive.backend.repository.ConversationRepository;
import com.strive.backend.repository.FriendshipRepository;
import com.strive.backend.repository.MessageRepository;
import com.strive.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final FriendshipRepository   friendshipRepository;
    private final UserRepository         userRepository;
    private final CurrentUserService     currentUserService;

    public ChatService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository      = messageRepository;
        this.friendshipRepository   = friendshipRepository;
        this.userRepository         = userRepository;
        this.currentUserService     = currentUserService;
    }

    // ── Conversaciones ────────────────────────────────────────────────────────

    /**
     * Devuelve la conversación existente con el amigo, o la crea si no existe.
     * Valida que ambos usuarios sean amigos antes de crear el canal.
     */
    @Transactional
    public ConversationDto obtenerOCrearConversacion(Long amigoId) {
        User yo    = currentUserService.getCurrentUser();
        User amigo = userRepository.findById(Objects.requireNonNull(amigoId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (yo.getId().equals(amigoId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes chatear contigo mismo");
        }
        if (!friendshipRepository.sonAmigos(yo.getId(), amigoId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes chatear con tus amigos");
        }

        // Normalizar: userA.id < userB.id (invariante del esquema)
        User userA = yo.getId() < amigo.getId() ? yo : amigo;
        User userB = yo.getId() < amigo.getId() ? amigo : yo;

        Conversation conv = conversationRepository
            .findByUserAIdAndUserBId(userA.getId(), userB.getId())
            .orElseGet(() -> {
                Conversation nueva = new Conversation();
                nueva.setUserA(userA);
                nueva.setUserB(userB);
                return conversationRepository.save(nueva);
            });

        return toConversationDto(conv, yo.getId());
    }

    /** Todas las conversaciones del usuario actual, ordenadas por actividad. */
    public List<ConversationDto> listarConversaciones() {
        User yo = currentUserService.getCurrentUser();
        return conversationRepository.findAllByUserId(yo.getId())
            .stream()
            .map(c -> toConversationDto(c, yo.getId()))
            .toList();
    }

    // ── Mensajes ──────────────────────────────────────────────────────────────

    /**
     * Historial paginado de una conversación (más reciente primero en BD,
     * invertido antes de devolver para que el frontend lo muestre
     * en orden cronológico ascendente).
     */
    public List<MessageDto> listarMensajes(Long conversationId, int page, int size) {
        User yo   = currentUserService.getCurrentUser();
        Conversation conv = resolverConversacion(conversationId, yo.getId());

        List<Message> mensajes = messageRepository
            .findByConversationIdOrderBySentAtDesc(conv.getId(), PageRequest.of(page, size));

        Collections.reverse(mensajes);
        return mensajes.stream().map(this::toMessageDto).toList();
    }

    /**
     * Persiste un mensaje de texto en la conversación y actualiza
     * lastMessageAt. Llamado tanto desde el REST controller (Issue 2.1)
     * como desde el WebSocket controller (Issue 2.2).
     */
    @Transactional
    public MessageDto guardarMensaje(Long conversationId, Long senderId,
                                     String content, MessageType type,
                                     Long routineId, String routineNameSnapshot) {
        Conversation conv   = resolverConversacion(conversationId, senderId);
        User         sender = userRepository.findById(Objects.requireNonNull(senderId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Message msg = new Message();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setType(type);
        msg.setRoutineId(routineId);
        msg.setRoutineNameSnapshot(routineNameSnapshot);
        msg.setSentAt(LocalDateTime.now());
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        return toMessageDto(msg);
    }

    /**
     * Versión para el WebSocket controller: recibe el email del remitente
     * (obtenido del Principal STOMP) en lugar de su ID.
     *
     * Ventaja: resuelve remitente, conversación y destinatario en una sola
     * transacción sin queries adicionales en el controller.
     */
    @Transactional
    public EnviarMensajeResultado procesarMensajeWs(
            Long conversationId, String senderEmail,
            String content, MessageType type,
            Long routineId, String routineNameSnapshot) {

        // 1. Resolver remitente por email (viene del Principal JWT)
        User sender = userRepository.findByEmail(senderEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Remitente no encontrado"));

        // 2. Validar participación y obtener conversación (reutiliza el helper privado)
        Conversation conv = resolverConversacion(conversationId, sender.getId());

        // 3. Determinar destinatario sin query extra: ya tenemos la conversación en memoria
        User destinatario = conv.getUserA().getId().equals(sender.getId())
            ? conv.getUserB()
            : conv.getUserA();

        // 4. Persistir mensaje
        Message msg = new Message();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setType(type);
        msg.setRoutineId(routineId);
        msg.setRoutineNameSnapshot(routineNameSnapshot);
        msg.setSentAt(LocalDateTime.now());
        messageRepository.save(msg);

        // 5. Actualizar timestamp de última actividad en la conversación
        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        return new EnviarMensajeResultado(toMessageDto(msg), destinatario.getEmail());
    }

    /** Marca como leídos todos los mensajes que no envió el usuario actual. */
    @Transactional
    public void marcarLeidos(Long conversationId) {
        User yo = currentUserService.getCurrentUser();
        resolverConversacion(conversationId, yo.getId());
        messageRepository.markAllAsRead(conversationId, yo.getId());
    }

    /** Total de mensajes sin leer en todas las conversaciones del usuario. */
    public long totalSinLeer() {
        return messageRepository.countTotalUnreadByUserId(currentUserService.getCurrentUser().getId());
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Conversation resolverConversacion(Long conversationId, Long userId) {
        Conversation conv = conversationRepository.findById(Objects.requireNonNull(conversationId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));
        boolean esParticipante = conv.getUserA().getId().equals(userId)
            || conv.getUserB().getId().equals(userId);
        if (!esParticipante) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a esta conversación");
        }
        return conv;
    }

    private ConversationDto toConversationDto(Conversation c, Long myId) {
        User otro = c.getUserA().getId().equals(myId) ? c.getUserB() : c.getUserA();
        long sinLeer = messageRepository
            .countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), myId);
        return new ConversationDto(
            c.getId(),
            new FriendUserDto(otro.getId(), otro.getFullName(), otro.getNickname()),
            c.getLastMessageAt(),
            sinLeer,
            c.getCreatedAt()
        );
    }

    private MessageDto toMessageDto(Message m) {
        return new MessageDto(
            m.getId(),
            m.getConversation().getId(),
            m.getSender().getId(),
            m.getSender().getEmail(),
            m.getSender().getFullName(),
            m.getContent(),
            m.getType(),
            m.getRoutineId(),
            m.getRoutineNameSnapshot(),
            m.isRead(),
            m.getSentAt()
        );
    }
}
