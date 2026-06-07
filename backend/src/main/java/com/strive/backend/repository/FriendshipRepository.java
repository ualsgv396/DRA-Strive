package com.strive.backend.repository;

import com.strive.backend.domain.Friendship;
import com.strive.backend.domain.FriendshipStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    @Query("""
            SELECT f FROM Friendship f
            WHERE f.status = com.strive.backend.domain.FriendshipStatus.ACCEPTED
            AND (f.requester.id = :userId OR f.addressee.id = :userId)
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findAcceptedFriendshipsForUser(@Param("userId") Long userId);

    List<Friendship> findByStatusAndAddresseeIdOrderByCreatedAtDesc(FriendshipStatus status, Long addresseeId);

    /**
     * Comprueba si dos usuarios tienen una amistad ACCEPTED en cualquier dirección.
     */
    @Query("""
        SELECT COUNT(f) > 0 FROM Friendship f
        WHERE f.status = com.strive.backend.domain.FriendshipStatus.ACCEPTED
          AND ((f.requester.id = :a AND f.addressee.id = :b)
            OR (f.requester.id = :b AND f.addressee.id = :a))
        """)
    boolean sonAmigos(@Param("a") Long userAId, @Param("b") Long userBId);

    /**
     * Devuelve los emails de los amigos ACEPTADOS de un usuario.
     *
     * Para cada amistad, selecciona el email del "otro" participante. Se usa
     * para enviar eventos de presencia (online/offline) solo a los amigos del
     * usuario que se conecta o desconecta. Devuelve Strings escalares, así que
     * no hay carga perezosa de asociaciones ni necesidad de transacción abierta.
     */
    @Query("""
        SELECT CASE WHEN f.requester.id = :userId THEN f.addressee.email ELSE f.requester.email END
        FROM Friendship f
        WHERE f.status = com.strive.backend.domain.FriendshipStatus.ACCEPTED
          AND (f.requester.id = :userId OR f.addressee.id = :userId)
        """)
    List<String> findAcceptedFriendEmails(@Param("userId") Long userId);

    @Query("""
        SELECT COUNT(f) FROM Friendship f
        WHERE f.status = com.strive.backend.domain.FriendshipStatus.ACCEPTED
          AND (f.requester.id = :userId OR f.addressee.id = :userId)
        """)
    long countAmigos(@Param("userId") Long userId);

    /** IDs de todos los amigos aceptados de un usuario. Usado para construir el feed. */
    @Query("""
        SELECT CASE WHEN f.requester.id = :userId THEN f.addressee.id ELSE f.requester.id END
        FROM Friendship f
        WHERE f.status = com.strive.backend.domain.FriendshipStatus.ACCEPTED
          AND (f.requester.id = :userId OR f.addressee.id = :userId)
        """)
    List<Long> findAcceptedFriendIds(@Param("userId") Long userId);
}
