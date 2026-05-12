package com.strive.backend.repository;

import com.strive.backend.domain.Routine;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findByOwnerId(Long ownerId);

    @Query("SELECT r FROM Routine r WHERE r.owner.id = :ownerId AND (r.isFlash = false OR (r.isFlash = true AND r.flashVisible = true))")
    List<Routine> findVisibleByOwnerId(@Param("ownerId") Long ownerId);

    @Modifying
    @Query("UPDATE Routine r SET r.flashVisible = false WHERE r.isFlash = true AND r.flashVisible = true AND r.flashExpiresAt < :now")
    int deactivateExpiredFlash(@Param("now") LocalDateTime now);
}
