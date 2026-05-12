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
}
