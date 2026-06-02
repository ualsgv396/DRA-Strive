package com.strive.backend.repository;

import com.strive.backend.domain.Message;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Mensajes de una conversación, paginados y ordenados del más reciente
     * al más antiguo. El frontend los invierte para mostrar el chat
     * en orden cronológico ascendente.
     */
    List<Message> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    /**
     * Número de mensajes no leídos en una conversación para el receptor
     * (es decir, mensajes que no fueron enviados por él mismo y que aún
     * no ha leído).
     */
    long countByConversationIdAndSenderIdNotAndIsReadFalse(
        Long conversationId,
        Long senderId
    );

    /**
     * Marca todos los mensajes de una conversación como leídos para el
     * receptor (cualquier mensaje que no haya enviado él).
     * Se llama cuando el usuario abre la ventana de chat.
     */
    @Modifying
    @Query("""
        UPDATE Message m SET m.isRead = true
        WHERE m.conversation.id = :conversationId
          AND m.sender.id <> :readerId
          AND m.isRead = false
        """)
    int markAllAsRead(
        @Param("conversationId") Long conversationId,
        @Param("readerId") Long readerId
    );

    /**
     * Total de mensajes no leídos en todas las conversaciones del usuario.
     * Útil para el badge de notificaciones global.
     */
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE (m.conversation.userA.id = :userId OR m.conversation.userB.id = :userId)
          AND m.sender.id <> :userId
          AND m.isRead = false
        """)
    long countTotalUnreadByUserId(@Param("userId") Long userId);
}
