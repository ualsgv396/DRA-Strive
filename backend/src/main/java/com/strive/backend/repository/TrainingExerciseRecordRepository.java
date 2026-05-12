package com.strive.backend.repository;

import com.strive.backend.domain.TrainingExerciseRecord;
import com.strive.backend.domain.TrainingSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingExerciseRecordRepository extends JpaRepository<TrainingExerciseRecord, Long> {
    List<TrainingExerciseRecord> findByTrainingSession(TrainingSession session);
}
