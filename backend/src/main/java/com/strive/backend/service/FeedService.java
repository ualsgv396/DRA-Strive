package com.strive.backend.service;

import com.strive.backend.domain.SessionReaction;
import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.User;
import com.strive.backend.dto.FeedItemDto;
import com.strive.backend.dto.ReaccionDto;
import com.strive.backend.repository.FriendshipRepository;
import com.strive.backend.repository.SessionReactionRepository;
import com.strive.backend.repository.TrainingSessionRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FeedService {

    private static final int FEED_SIZE = 20;

    private final FriendshipRepository      friendshipRepository;
    private final TrainingSessionRepository sessionRepository;
    private final SessionReactionRepository reactionRepository;
    private final CurrentUserService        currentUserService;

    public FeedService(
            FriendshipRepository friendshipRepository,
            TrainingSessionRepository sessionRepository,
            SessionReactionRepository reactionRepository,
            CurrentUserService currentUserService) {
        this.friendshipRepository = friendshipRepository;
        this.sessionRepository    = sessionRepository;
        this.reactionRepository   = reactionRepository;
        this.currentUserService   = currentUserService;
    }

    // ── Feed ──────────────────────────────────────────────────────────────────

    public List<FeedItemDto> obtenerFeed() {
        User yo = currentUserService.getCurrentUser();

        List<Long> amigoIds = friendshipRepository.findAcceptedFriendIds(yo.getId());
        if (amigoIds.isEmpty()) return List.of();

        List<TrainingSession> sesiones = sessionRepository.findFeedForFriends(
            amigoIds, PageRequest.of(0, FEED_SIZE));
        if (sesiones.isEmpty()) return List.of();

        List<Long> sessionIds = sesiones.stream().map(TrainingSession::getId).toList();

        // Conteo de ejercicios por sesión — una sola query
        Map<Long, Long> ejerciciosPorSesion = new HashMap<>();
        sessionRepository.countExercisesBySessionIds(sessionIds)
            .forEach(row -> ejerciciosPorSesion.put((Long) row[0], (Long) row[1]));

        // Reacciones por sesión — una sola query
        Map<Long, List<ReaccionDto>> reaccionesPorSesion = buildReactionMap(sessionIds, yo.getId());

        return sesiones.stream().map(ts -> new FeedItemDto(
            ts.getId(),
            ts.getUser().getId(),
            ts.getUser().getFullName(),
            ts.getUser().getNickname(),
            ts.getRoutine().getName(),
            ts.getCompletedAt(),
            ts.getDurationMinutes(),
            ejerciciosPorSesion.getOrDefault(ts.getId(), 0L),
            reaccionesPorSesion.getOrDefault(ts.getId(), List.of())
        )).toList();
    }

    // ── Toggle reacción ───────────────────────────────────────────────────────

    @Transactional
    public List<ReaccionDto> toggleReaccion(Long sessionId, String emoji) {
        User yo = currentUserService.getCurrentUser();

        // Verificar que la sesión existe y no es propia
        TrainingSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
        if (session.getUserId().equals(yo.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No puedes reaccionar a tus propios entrenos");
        }

        Optional<SessionReaction> existing =
            reactionRepository.findByUserIdAndSessionIdAndEmoji(yo.getId(), sessionId, emoji);

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            SessionReaction reaction = new SessionReaction();
            reaction.setUser(yo);
            reaction.setSession(session);
            reaction.setEmoji(emoji);
            reactionRepository.save(reaction);
        }

        // Devolver el estado actualizado de reacciones para esta sesión
        return toReaccionDtos(
            reactionRepository.countBySessionAndUser(sessionId, yo.getId()));
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Map<Long, List<ReaccionDto>> buildReactionMap(List<Long> sessionIds, Long userId) {
        Map<Long, List<ReaccionDto>> mapa = new HashMap<>();
        reactionRepository.countBySessionsAndUser(sessionIds, userId)
            .forEach(row -> {
                Long   sid   = (Long)   row[0];
                String emoji = (String) row[1];
                long   total = (Long)   row[2];
                boolean mia  = ((Long)  row[3]) > 0;
                mapa.computeIfAbsent(sid, k -> new ArrayList<>())
                    .add(new ReaccionDto(emoji, total, mia));
            });
        return mapa;
    }

    private List<ReaccionDto> toReaccionDtos(List<Object[]> rows) {
        return rows.stream()
            .map(row -> new ReaccionDto(
                (String) row[0],
                (Long)   row[1],
                ((Long)  row[2]) > 0))
            .toList();
    }
}
