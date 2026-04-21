package com.strive.backend.service;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.Routine;
import com.strive.backend.domain.RoutineExercise;
import com.strive.backend.domain.User;
import com.strive.backend.dto.CreateRoutineRequest;
import com.strive.backend.dto.RoutineExerciseRequest;
import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoutineService {

    private final RoutineRepository routineRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;

    public RoutineService(
            RoutineRepository routineRepository,
            UserRepository userRepository,
            ExerciseRepository exerciseRepository
    ) {
        this.routineRepository = routineRepository;
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
    }

    public List<Routine> findByOwner(Long ownerId) {
        return routineRepository.findByOwnerId(ownerId);
    }

    @Transactional
    public Routine create(CreateRoutineRequest request) {
        User owner = userRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        Routine routine = new Routine();
        routine.setName(request.name());
        routine.setGoal(request.goal());
        routine.setOwner(owner);

        for (RoutineExerciseRequest item : request.exercises()) {
            Exercise exercise = exerciseRepository.findById(item.exerciseId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Exercise not found with id=" + item.exerciseId()
                    ));

            RoutineExercise routineExercise = new RoutineExercise();
            routineExercise.setRoutine(routine);
            routineExercise.setExercise(exercise);
            routineExercise.setSets(item.sets());
            routineExercise.setReps(item.reps());
            routineExercise.setSortOrder(item.sortOrder());
            routine.getRoutineExercises().add(routineExercise);
        }

        return routineRepository.save(routine);
    }
}
