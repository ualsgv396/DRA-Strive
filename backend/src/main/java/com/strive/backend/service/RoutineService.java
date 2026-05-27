package com.strive.backend.service;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.domain.Routine;
import com.strive.backend.domain.RoutineExercise;
import com.strive.backend.domain.User;
import com.strive.backend.dto.CreateFlashRoutineRequest;
import com.strive.backend.dto.CreateRoutineRequest;
import com.strive.backend.dto.ReorderExerciseRequest;
import com.strive.backend.dto.RoutineExerciseRequest;
import com.strive.backend.dto.UpdateRoutineExerciseRequest;
import java.time.LocalDateTime;
import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.RoutineExerciseRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.TrainingSessionRepository;
import com.strive.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoutineService {

    private final RoutineRepository routineRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final RoutineExerciseRepository routineExerciseRepository;
    private final TrainingSessionRepository trainingSessionRepository;

    public RoutineService(
            RoutineRepository routineRepository,
            UserRepository userRepository,
            ExerciseRepository exerciseRepository,
            RoutineExerciseRepository routineExerciseRepository,
            TrainingSessionRepository trainingSessionRepository
    ) {
        this.routineRepository = routineRepository;
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
        this.routineExerciseRepository = routineExerciseRepository;
        this.trainingSessionRepository = trainingSessionRepository;
    }

    public List<Routine> findByOwner(Long ownerId) {
        return routineRepository.findByOwnerId(ownerId);
    }

    public List<Routine> findVisibleByOwner(Long ownerId) {
        return routineRepository.findVisibleByOwnerId(ownerId);
    }

    @Transactional
    public Routine createFlashRoutine(CreateFlashRoutineRequest request) {
        User owner = userRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        Routine routine = new Routine();
        routine.setName(request.name());
        routine.setGoal(request.goal());
        routine.setOwner(owner);
        routine.setFlash(true);
        routine.setFlashExpiresAt(LocalDateTime.now().plusMinutes(request.flashDurationMinutes()));
        routine.setFlashVisible(true);

        for (RoutineExerciseRequest item : request.exercises()) {
            Exercise exercise = exerciseRepository.findById(item.exerciseId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Exercise not found: " + item.exerciseId()));

            RoutineExercise re = new RoutineExercise();
            re.setRoutine(routine);
            re.setExercise(exercise);
            re.setSets(item.sets());
            re.setReps(item.reps());
            re.setSortOrder(item.sortOrder());
            re.setLoadValue(item.loadValue());
            re.setLoadUnit(item.loadUnit() != null ? item.loadUnit() : defaultLoadUnit(exercise));
            routine.getRoutineExercises().add(re);
        }

        return routineRepository.save(routine);
    }

    @Transactional
    public void deactivateExpiredFlashRoutines() {
        routineRepository.deactivateExpiredFlash(LocalDateTime.now());
    }

    public Optional<Routine> findById(Long id) {
        return routineRepository.findById(id);
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
                            HttpStatus.NOT_FOUND, "Exercise not found: " + item.exerciseId()));

            RoutineExercise re = new RoutineExercise();
            re.setRoutine(routine);
            re.setExercise(exercise);
            re.setSets(item.sets());
            re.setReps(item.reps());
            re.setSortOrder(item.sortOrder());
            re.setLoadValue(item.loadValue());
            re.setLoadUnit(item.loadUnit() != null ? item.loadUnit() : defaultLoadUnit(exercise));
            routine.getRoutineExercises().add(re);
        }

        return routineRepository.save(routine);
    }

    @Transactional
    public RoutineExercise addExerciseToRoutine(
            Long routineId, Long exerciseId,
            Integer sets, Integer reps,
            Double loadValue, String loadUnit) {

        Routine routine = routineRepository.findById(routineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));

        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise not found"));

        RoutineExercise re = new RoutineExercise();
        re.setRoutine(routine);
        re.setExercise(exercise);
        re.setSets(sets != null ? sets : 3);
        re.setReps(reps != null ? reps : 10);
        re.setSortOrder(routine.getRoutineExercises().size());
        re.setLoadValue(loadValue);
        re.setLoadUnit(loadUnit != null ? loadUnit : defaultLoadUnit(exercise));

        routine.getRoutineExercises().add(re);
        routineRepository.save(routine);
        return re;
    }

    @Transactional
    public Routine duplicateRoutine(Long originalId, Long userId) {
        Routine original = routineRepository.findById(originalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Routine copy = new Routine();
        copy.setName("Copia de " + original.getName());
        copy.setGoal(original.getGoal());
        copy.setOwner(owner);

        for (RoutineExercise re : original.getRoutineExercises()) {
            RoutineExercise copyRe = new RoutineExercise();
            copyRe.setRoutine(copy);
            copyRe.setExercise(re.getExercise());
            copyRe.setSets(re.getSets());
            copyRe.setReps(re.getReps());
            copyRe.setSortOrder(re.getSortOrder());
            copyRe.setLoadValue(re.getLoadValue());
            copyRe.setLoadUnit(re.getLoadUnit());
            copy.getRoutineExercises().add(copyRe);
        }

        return routineRepository.save(copy);
    }

    @Transactional
    public void deleteRoutine(Long id) {
        if (!routineRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found");
        }
        trainingSessionRepository.deleteAllByRoutineId(id);
        routineRepository.deleteById(id);
    }

    @Transactional
    public void removeExerciseFromRoutine(Long routineId, Long routineExerciseId) {
        Routine routine = routineRepository.findById(routineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));
        routine.getRoutineExercises().removeIf(re -> re.getId().equals(routineExerciseId));
        routineRepository.save(routine);
    }

    @Transactional
    public Routine updateRoutine(Long id, CreateRoutineRequest request) {
        Routine routine = routineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));
        routine.setName(request.name());
        routine.setGoal(request.goal());
        return routineRepository.save(routine);
    }

    @Transactional
    public Routine patchRoutine(Long id, com.strive.backend.dto.PatchRoutineRequest request) {
        Routine routine = routineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));
        routine.setName(request.name());
        routine.setGoal(request.goal());
        return routineRepository.save(routine);
    }

    @Transactional
    public RoutineExercise updateRoutineExercise(Long routineId, Long routineExerciseId,
            UpdateRoutineExerciseRequest request) {
        RoutineExercise re = routineExerciseRepository.findById(routineExerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exercise entry not found"));
        if (!re.getRoutine().getId().equals(routineId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exercise does not belong to this routine");
        }
        re.setSets(request.sets());
        re.setReps(request.reps());
        re.setLoadValue(request.loadValue());
        if (request.loadUnit() != null) {
            re.setLoadUnit(request.loadUnit());
        }
        return routineExerciseRepository.save(re);
    }

    @Transactional
    public List<RoutineExercise> reorderExercises(Long routineId, List<ReorderExerciseRequest> items) {
        List<RoutineExercise> toSave = new ArrayList<>();
        for (ReorderExerciseRequest item : items) {
            RoutineExercise re = routineExerciseRepository.findById(item.routineExerciseId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Exercise entry not found: " + item.routineExerciseId()));
            if (!re.getRoutine().getId().equals(routineId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exercise does not belong to this routine");
            }
            re.setSortOrder(item.sortOrder());
            toSave.add(re);
        }
        return routineExerciseRepository.saveAll(toSave);
    }

    private String defaultLoadUnit(Exercise exercise) {
        return exercise.getType() == ExerciseType.CARDIO ? "SECONDS" : "KG";
    }
}
