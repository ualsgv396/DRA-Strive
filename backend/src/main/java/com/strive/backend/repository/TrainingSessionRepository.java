package com.strive.backend.repository;

import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.TrainingSessionStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {
    void deleteAllByRoutineId(Long routineId);
    List<TrainingSession> findTop30ByUserIdOrderByStartedAtDesc(Long userId);
    List<TrainingSession> findByUserIdAndStatusOrderByStartedAtDesc(Long userId, TrainingSessionStatus status);
    List<TrainingSession> findByRoutineIdAndUserIdOrderByStartedAtDesc(Long routineId, Long userId);

    long countByStartedAtBetween(LocalDateTime inicio, LocalDateTime fin);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, TrainingSessionStatus status);

    @Query("SELECT COUNT(DISTINCT ts.user.id) FROM TrainingSession ts WHERE ts.startedAt > :desde")
    long countDistinctUsersSince(@Param("desde") LocalDateTime desde);

    @Query("SELECT ts.user.id, COUNT(ts) FROM TrainingSession ts WHERE ts.user.id IN :ids GROUP BY ts.user.id")
    List<Object[]> countByUserIds(@Param("ids") List<Long> ids);

    @Query("SELECT ts.user.id, MAX(ts.startedAt) FROM TrainingSession ts WHERE ts.user.id IN :ids GROUP BY ts.user.id")
    List<Object[]> findLastSessionDateByUserIds(@Param("ids") List<Long> ids);

    @Query("SELECT ts FROM TrainingSession ts JOIN FETCH ts.user JOIN FETCH ts.routine WHERE ts.startedAt >= :desde ORDER BY ts.startedAt ASC")
    List<TrainingSession> findByStartedAtAfterWithDetails(@Param("desde") LocalDateTime desde);

    @Query("SELECT ts FROM TrainingSession ts JOIN FETCH ts.user JOIN FETCH ts.routine ORDER BY ts.startedAt DESC LIMIT 5")
    List<TrainingSession> findTop5WithDetails();

    /**
     * Sesiones completadas de un conjunto de usuarios (amigos), ordenadas por
     * fecha de finalización descendente. JOIN FETCH sobre ManyToOne es seguro
     * con Pageable porque no involucra colecciones.
     */
    @Query("""
        SELECT ts FROM TrainingSession ts
        JOIN FETCH ts.user u
        JOIN FETCH ts.routine r
        WHERE ts.user.id IN :friendIds
          AND ts.status = com.strive.backend.domain.TrainingSessionStatus.COMPLETED
          AND ts.completedAt IS NOT NULL
        ORDER BY ts.completedAt DESC
        """)
    List<TrainingSession> findFeedForFriends(
        @Param("friendIds") List<Long> friendIds,
        Pageable pageable);

    /**
     * Cuenta los ejercicios registrados por sesión para un lote de IDs.
     * Devuelve Object[] { sessionId (Long), count (Long) }.
     */
    @Query("""
        SELECT ts.id, COUNT(ter)
        FROM TrainingSession ts
        LEFT JOIN ts.records ter
        WHERE ts.id IN :ids
        GROUP BY ts.id
        """)
    List<Object[]> countExercisesBySessionIds(@Param("ids") List<Long> ids);
}
