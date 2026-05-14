package com.strive.backend.repository;

import com.strive.backend.domain.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNicknameIgnoreCase(String nickname);
    List<User> findTop10ByNicknameContainingIgnoreCaseOrderByNicknameAsc(String nickname);

    long countByCreatedAtAfter(LocalDateTime desde);
    long countByCreatedAtBetween(LocalDateTime inicio, LocalDateTime fin);
    long countBySuspendedTrue();

    List<User> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT u FROM User u WHERE u.createdAt >= :desde ORDER BY u.createdAt ASC")
    List<User> findByCreatedAtAfterOrderByCreatedAtAsc(@Param("desde") LocalDateTime desde);
}
