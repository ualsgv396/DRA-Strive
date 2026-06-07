package com.strive.backend.repository;

import com.strive.backend.domain.SessionReaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionReactionRepository extends JpaRepository<SessionReaction, Long> {

    Optional<SessionReaction> findByUserIdAndSessionIdAndEmoji(
        Long userId, Long sessionId, String emoji);

    /**
     * Devuelve (sessionId, emoji, totalCount, esDelUsuario) para un lote de sesiones.
     * Una sola query para todas las sesiones del feed → evita N+1.
     */
    @Query("""
        SELECT sr.session.id,
               sr.emoji,
               COUNT(sr),
               SUM(CASE WHEN sr.user.id = :userId THEN 1 ELSE 0 END)
        FROM SessionReaction sr
        WHERE sr.session.id IN :sessionIds
        GROUP BY sr.session.id, sr.emoji
        """)
    List<Object[]> countBySessionsAndUser(
        @Param("sessionIds") List<Long> sessionIds,
        @Param("userId")     Long userId);

    /** Reacciones actualizadas de una sola sesión (respuesta al toggle). */
    @Query("""
        SELECT sr.emoji,
               COUNT(sr),
               SUM(CASE WHEN sr.user.id = :userId THEN 1 ELSE 0 END)
        FROM SessionReaction sr
        WHERE sr.session.id = :sessionId
        GROUP BY sr.emoji
        """)
    List<Object[]> countBySessionAndUser(
        @Param("sessionId") Long sessionId,
        @Param("userId")    Long userId);
}
