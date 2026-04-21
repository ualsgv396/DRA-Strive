package com.strive.backend.repository;

import com.strive.backend.domain.Routine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findByOwnerId(Long ownerId);
}
