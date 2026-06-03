package com.strive.backend.controller;

import com.strive.backend.domain.Routine;
import com.strive.backend.domain.RoutineExercise;
import com.strive.backend.domain.User;
import com.strive.backend.domain.UserRole;
import com.strive.backend.dto.AddExerciseToRoutineRequest;
import com.strive.backend.dto.CreateFlashRoutineRequest;
import com.strive.backend.dto.CreateRoutineRequest;
import com.strive.backend.dto.PatchRoutineRequest;
import com.strive.backend.dto.ReorderExerciseRequest;
import com.strive.backend.dto.UpdateRoutineExerciseRequest;
import com.strive.backend.exception.AccessDeniedException;
import com.strive.backend.service.CurrentUserService;
import com.strive.backend.service.RoutineService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/routines")
public class RoutineController {

    private final RoutineService routineService;
    private final CurrentUserService currentUserService;

    public RoutineController(RoutineService routineService, CurrentUserService currentUserService) {
        this.routineService = routineService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Routine> listByOwner(@RequestParam Long ownerId) {
        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN && !currentUser.getId().equals(ownerId)) {
            throw new AccessDeniedException();
        }
        return routineService.findVisibleByOwner(ownerId);
    }

    @PostMapping("/flash")
    @ResponseStatus(HttpStatus.CREATED)
    public Routine createFlash(@Valid @RequestBody CreateFlashRoutineRequest request) {
        return routineService.createFlashRoutine(request);
    }

    @GetMapping("/{id}")
    public Routine getById(@PathVariable Long id) {
        return requireOwnership(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Routine create(@Valid @RequestBody CreateRoutineRequest request) {
        return routineService.create(request);
    }

    @PutMapping("/{id}")
    public Routine update(@PathVariable Long id, @Valid @RequestBody CreateRoutineRequest request) {
        requireOwnership(id);
        return routineService.updateRoutine(id, request);
    }

    @PatchMapping("/{id}")
    public Routine patch(@PathVariable Long id, @Valid @RequestBody PatchRoutineRequest request) {
        requireOwnership(id);
        return routineService.patchRoutine(id, request);
    }

    @PostMapping("/{id}/exercises")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineExercise addExercise(
            @PathVariable Long id,
            @Valid @RequestBody AddExerciseToRoutineRequest request) {
        requireOwnership(id);
        return routineService.addExerciseToRoutine(
                id,
                request.exerciseId(),
                request.sets(),
                request.reps(),
                request.loadValue(),
                request.loadUnit()
        );
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public Routine duplicate(@PathVariable Long id) {
        requireOwnership(id);
        User currentUser = currentUserService.getCurrentUser();
        return routineService.duplicateRoutine(id, currentUser.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        requireOwnership(id);
        routineService.deleteRoutine(id);
    }

    @DeleteMapping("/{routineId}/exercises/{exerciseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeExercise(@PathVariable Long routineId, @PathVariable Long exerciseId) {
        requireOwnership(routineId);
        routineService.removeExerciseFromRoutine(routineId, exerciseId);
    }

    @PutMapping("/{routineId}/exercises/{routineExerciseId}")
    public RoutineExercise updateExercise(
            @PathVariable Long routineId,
            @PathVariable Long routineExerciseId,
            @Valid @RequestBody UpdateRoutineExerciseRequest request) {
        requireOwnership(routineId);
        return routineService.updateRoutineExercise(routineId, routineExerciseId, request);
    }

    @PatchMapping("/{routineId}/exercises/reorder")
    public List<RoutineExercise> reorderExercises(
            @PathVariable Long routineId,
            @Valid @RequestBody List<ReorderExerciseRequest> items) {
        requireOwnership(routineId);
        return routineService.reorderExercises(routineId, items);
    }

    private Routine requireOwnership(Long routineId) {
        Routine routine = routineService.findById(routineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found: " + routineId));
        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN && !routine.getOwnerId().equals(currentUser.getId())) {
            throw new AccessDeniedException();
        }
        return routine;
    }
}
