package com.strive.backend.repository;

import com.strive.backend.domain.UserStreak;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStreakRepository extends JpaRepository<UserStreak, Long> {
    Optional<UserStreak> findByUserId(Long userId);
}
