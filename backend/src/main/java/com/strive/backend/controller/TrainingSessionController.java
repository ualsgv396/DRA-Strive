package com.strive.backend.controller;

import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.User;
import com.strive.backend.dto.CompleteTrainingSessionRequest;
import com.strive.backend.dto.StartTrainingSessionRequest;
import com.strive.backend.dto.TrainingSessionResponseDto;
import com.strive.backend.exception.AccessDeniedException;
import com.strive.backend.service.CurrentUserService;
import com.strive.backend.service.TrainingSessionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/training-sessions")
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;
    private final CurrentUserService currentUserService;

    public TrainingSessionController(
            TrainingSessionService trainingSessionService,
            CurrentUserService currentUserService) {
        this.trainingSessionService = trainingSessionService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingSessionResponseDto start(@Valid @RequestBody StartTrainingSessionRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        return trainingSessionService.startSession(currentUser.getId(), request.routineId(), request.notes());
    }

    @PutMapping("/{id}/complete")
    public TrainingSessionResponseDto complete(
            @PathVariable Long id,
            @Valid @RequestBody CompleteTrainingSessionRequest request) {
        requireOwnership(id);
        return trainingSessionService.completeSession(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void abandon(@PathVariable Long id) {
        requireOwnership(id);
        trainingSessionService.abandonSession(id);
    }

    @GetMapping
    public List<TrainingSessionResponseDto> history(
            @RequestParam(defaultValue = "30") int limit) {
        User currentUser = currentUserService.getCurrentUser();
        return trainingSessionService.getHistory(currentUser.getId(), limit);
    }

    @GetMapping("/routine/{routineId}")
    public List<TrainingSessionResponseDto> byRoutine(@PathVariable Long routineId) {
        User currentUser = currentUserService.getCurrentUser();
        return trainingSessionService.getByRoutine(currentUser.getId(), routineId);
    }

    private TrainingSession requireOwnership(Long sessionId) {
        TrainingSession session = trainingSessionService.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        User currentUser = currentUserService.getCurrentUser();
        if (!session.getUserId().equals(currentUser.getId())) {
            throw new AccessDeniedException();
        }
        return session;
    }
}
