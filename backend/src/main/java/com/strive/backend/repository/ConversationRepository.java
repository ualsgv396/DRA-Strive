package com.strive.backend.repository;

import com.strive.backend.domain.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Busca la conversación entre dos usuarios.
     * Los ids deben pasarse ya ordenados (userAId < userBId), tal como
     * los normaliza ChatService antes de llamar a este método.
     */
    Optional<Conversation> findByUserAIdAndUserBId(Long userAId, Long userBId);

    /**
     * Devuelve todas las conversaciones en las que participa el usuario,
     * ordenadas por actividad reciente (lastMessageAt desc).
     * Las conversaciones sin mensajes aparecen al final.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.userA.id = :userId OR c.userB.id = :userId
        ORDER BY
            CASE WHEN c.lastMessageAt IS NULL THEN 1 ELSE 0 END ASC,
            c.lastMessageAt DESC
        """)
    List<Conversation> findAllByUserId(@Param("userId") Long userId);
}
