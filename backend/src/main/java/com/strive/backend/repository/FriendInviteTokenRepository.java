package com.strive.backend.repository;

import com.strive.backend.domain.FriendInviteToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendInviteTokenRepository extends JpaRepository<FriendInviteToken, Long> {
    Optional<FriendInviteToken> findByToken(String token);
}
