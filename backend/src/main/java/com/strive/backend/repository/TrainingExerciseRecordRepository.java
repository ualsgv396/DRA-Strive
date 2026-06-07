package com.strive.backend.repository;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.TrainingExerciseRecord;
import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.TrainingSessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrainingExerciseRecordRepository extends JpaRepository<TrainingExerciseRecord, Long> {

    List<TrainingExerciseRecord> findByTrainingSession(TrainingSession session);

    /**
     * Todos los registros completados del usuario para un ejercicio concreto,
     * ordenados cronológicamente.
     * JOIN FETCH para evitar N+1 al acceder a session.completedAt y exercise.title.
     */
    @Query("""
        SELECT ter FROM TrainingExerciseRecord ter
        JOIN FETCH ter.routineExercise re
        JOIN FETCH re.exercise e
        JOIN FETCH ter.trainingSession ts
        WHERE ts.user.id      = :userId
          AND e.id            = :exerciseId
          AND ts.status       = :status
          AND ts.completedAt IS NOT NULL
        ORDER BY ts.completedAt ASC
        """)
    List<TrainingExerciseRecord> findByUserAndExercise(
        @Param("userId")     Long userId,
        @Param("exerciseId") Long exerciseId,
        @Param("status")     TrainingSessionStatus status);

    /**
     * Ejercicios distintos que el usuario ha registrado en sesiones completadas,
     * ordenados alfabéticamente. Usado para el selector de ejercicio en la vista de progreso.
     */
    @Query("""
        SELECT DISTINCT re.exercise
        FROM TrainingExerciseRecord ter
        JOIN ter.routineExercise re
        JOIN ter.trainingSession ts
        WHERE ts.user.id = :userId
          AND ts.status  = :status
        ORDER BY re.exercise.title ASC
        """)
    List<Exercise> findDistinctExercisesByUser(
        @Param("userId") Long userId,
        @Param("status") TrainingSessionStatus status);
}
