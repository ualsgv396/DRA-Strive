package com.strive.backend.repository;

import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.TrainingSessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
    List<TrainingSession> findTop30ByUserIdOrderByStartedAtDesc(Long userId);
    List<TrainingSession> findByUserIdAndStatusOrderByStartedAtDesc(Long userId, TrainingSessionStatus status);
    List<TrainingSession> findByRoutineIdAndUserIdOrderByStartedAtDesc(Long routineId, Long userId);
}
