package com.strive.backend.repository;

import com.strive.backend.domain.BadgeType;
import com.strive.backend.domain.UserBadge;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdOrderByUnlockedAtAsc(Long userId);
    boolean existsByUserIdAndType(Long userId, BadgeType type);
}
