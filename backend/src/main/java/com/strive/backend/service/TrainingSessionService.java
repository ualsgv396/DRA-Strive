package com.strive.backend.service;

import com.strive.backend.domain.Routine;
import com.strive.backend.domain.RoutineExercise;
import com.strive.backend.domain.TrainingExerciseRecord;
import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.TrainingSessionStatus;
import com.strive.backend.domain.User;
import com.strive.backend.dto.CompleteTrainingSessionRequest;
import com.strive.backend.dto.ExerciseRecordRequest;
import com.strive.backend.dto.TrainingSessionResponseDto;
import com.strive.backend.repository.RoutineExerciseRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.TrainingSessionRepository;
import com.strive.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrainingSessionService {

    private final TrainingSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final RoutineRepository routineRepository;
    private final RoutineExerciseRepository routineExerciseRepository;

    public TrainingSessionService(
            TrainingSessionRepository sessionRepository,
            UserRepository userRepository,
            RoutineRepository routineRepository,
            RoutineExerciseRepository routineExerciseRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.routineRepository = routineRepository;
        this.routineExerciseRepository = routineExerciseRepository;
    }

    @Transactional
    public TrainingSessionResponseDto startSession(Long userId, Long routineId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Routine routine = routineRepository.findById(routineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Routine not found"));
        if (!routine.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Routine does not belong to this user");
        }

        TrainingSession session = new TrainingSession();
        session.setUser(user);
        session.setRoutine(routine);
        session.setStartedAt(LocalDateTime.now());
        session.setStatus(TrainingSessionStatus.STARTED);
        session.setNotes(notes);

        return toDto(sessionRepository.save(session));
    }

    @Transactional
    public TrainingSessionResponseDto completeSession(Long sessionId, CompleteTrainingSessionRequest request) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if (session.getStatus() != TrainingSessionStatus.STARTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not in STARTED state");
        }

        session.setCompletedAt(LocalDateTime.now());
        session.setDurationMinutes(request.durationMinutes());
        session.setStatus(TrainingSessionStatus.COMPLETED);
        if (request.notes() != null) {
            session.setNotes(request.notes());
        }

        if (request.exercises() != null) {
            for (ExerciseRecordRequest er : request.exercises()) {
                RoutineExercise re = routineExerciseRepository.findById(er.routineExerciseId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Exercise entry not found: " + er.routineExerciseId()));
                TrainingExerciseRecord record = new TrainingExerciseRecord();
                record.setTrainingSession(session);
                record.setRoutineExercise(re);
                record.setSetsCompleted(er.setsCompleted());
                record.setRepsCompleted(er.repsCompleted());
                record.setLoadCompleted(er.loadCompleted());
                record.setLoadUnit(er.loadUnit());
                record.setNotes(er.notes());
                session.getRecords().add(record);
            }
        }

        return toDto(sessionRepository.save(session));
    }

    @Transactional
    public void abandonSession(Long sessionId) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        session.setStatus(TrainingSessionStatus.ABANDONED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionResponseDto> getHistory(Long userId, int limit) {
        return sessionRepository.findTop30ByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .limit(Math.min(limit, 30))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionResponseDto> getByRoutine(Long userId, Long routineId) {
        return sessionRepository.findByRoutineIdAndUserIdOrderByStartedAtDesc(routineId, userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<TrainingSession> findById(Long id) {
        return sessionRepository.findById(id);
    }

    private TrainingSessionResponseDto toDto(TrainingSession session) {
        return new TrainingSessionResponseDto(
                session.getId(),
                session.getRoutineId(),
                session.getRoutine().getName(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getDurationMinutes(),
                session.getStatus().name(),
                session.getNotes(),
                session.getRecords()
        );
    }
}
