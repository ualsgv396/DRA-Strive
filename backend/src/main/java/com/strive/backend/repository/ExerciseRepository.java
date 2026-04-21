package com.strive.backend.repository;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByType(ExerciseType type);
}
