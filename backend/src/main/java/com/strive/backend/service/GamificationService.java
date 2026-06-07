package com.strive.backend.service;

import com.strive.backend.domain.BadgeType;
import com.strive.backend.domain.TrainingSessionStatus;
import com.strive.backend.domain.User;
import com.strive.backend.domain.UserBadge;
import com.strive.backend.domain.UserStreak;
import com.strive.backend.dto.BadgeDto;
import com.strive.backend.dto.GamificationDto;
import com.strive.backend.repository.FriendshipRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.TrainingSessionRepository;
import com.strive.backend.repository.UserBadgeRepository;
import com.strive.backend.repository.UserStreakRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GamificationService {

    private final UserStreakRepository    streakRepository;
    private final UserBadgeRepository    badgeRepository;
    private final TrainingSessionRepository sessionRepository;
    private final RoutineRepository      routineRepository;
    private final FriendshipRepository   friendshipRepository;
    private final CurrentUserService     currentUserService;

    public GamificationService(
            UserStreakRepository streakRepository,
            UserBadgeRepository badgeRepository,
            TrainingSessionRepository sessionRepository,
            RoutineRepository routineRepository,
            FriendshipRepository friendshipRepository,
            CurrentUserService currentUserService) {
        this.streakRepository    = streakRepository;
        this.badgeRepository     = badgeRepository;
        this.sessionRepository   = sessionRepository;
        this.routineRepository   = routineRepository;
        this.friendshipRepository = friendshipRepository;
        this.currentUserService  = currentUserService;
    }

    // ── Consulta pública ──────────────────────────────────────────────────────

    /** Devuelve la racha y los logros del usuario actual. */
    @Transactional(readOnly = true)
    public GamificationDto obtenerMiGamificacion() {
        User yo = currentUserService.getCurrentUser();
        UserStreak streak = streakRepository.findByUserId(yo.getId())
            .orElseGet(() -> emptyStreak(yo));
        List<BadgeDto> logros = badgeRepository
            .findByUserIdOrderByUnlockedAtAsc(yo.getId())
            .stream()
            .map(b -> new BadgeDto(b.getType(), b.getUnlockedAt()))
            .toList();
        return new GamificationDto(
            streak.getCurrentStreak(),
            streak.getLongestStreak(),
            streak.getLastTrainingDate(),
            logros
        );
    }

    // ── Procesamiento al completar un entreno ─────────────────────────────────

    /**
     * Actualiza la racha y evalúa todos los logros relacionados con entrenar.
     * Devuelve la lista de NUEVOS logros desbloqueados en esta llamada,
     * para que el frontend pueda mostrar toasts al instante.
     */
    @Transactional
    public List<BadgeDto> procesarLogrosDeEntreno(User user) {
        UserStreak streak = actualizarRacha(user);
        return evaluarYOtorgar(user, streak);
    }

    /**
     * Otorga un logro puntual (e.g. FIRST_SHARE desde ChatService).
     * No-op si ya se tenía. Devuelve true si se acaba de desbloquear.
     */
    @Transactional
    public boolean otorgarSiNuevo(User user, BadgeType tipo) {
        if (badgeRepository.existsByUserIdAndType(user.getId(), tipo)) return false;
        UserBadge badge = new UserBadge();
        badge.setUser(user);
        badge.setType(tipo);
        badgeRepository.save(badge);
        return true;
    }

    // ── Lógica interna ────────────────────────────────────────────────────────

    private UserStreak actualizarRacha(User user) {
        LocalDate hoy = LocalDate.now();
        UserStreak streak = streakRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserStreak s = new UserStreak();
                s.setUser(user);
                return s;
            });

        // Ya se contó el entreno de hoy: no incrementar
        if (hoy.equals(streak.getLastTrainingDate())) return streak;

        if (streak.getLastTrainingDate() != null
                && hoy.equals(streak.getLastTrainingDate().plusDays(1))) {
            // Día consecutivo: racha continúa
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            // Hueco de más de un día o primera sesión: reiniciar
            streak.setCurrentStreak(1);
        }

        streak.setLastTrainingDate(hoy);
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }
        return streakRepository.save(streak);
    }

    private List<BadgeDto> evaluarYOtorgar(User user, UserStreak streak) {
        long sesiones = sessionRepository.countByUserIdAndStatus(
            user.getId(), TrainingSessionStatus.COMPLETED);
        long rutinas  = routineRepository.countByOwnerId(user.getId());
        long amigos   = friendshipRepository.countAmigos(user.getId());
        int  racha    = streak.getCurrentStreak();

        List<BadgeType> candidatos = List.of(
            BadgeType.FIRST_SESSION,
            BadgeType.SESSIONS_5,
            BadgeType.SESSIONS_10,
            BadgeType.SESSIONS_25,
            BadgeType.SESSIONS_50,
            BadgeType.STREAK_3,
            BadgeType.STREAK_7,
            BadgeType.STREAK_30,
            BadgeType.FIRST_ROUTINE,
            BadgeType.ROUTINES_5,
            BadgeType.FIRST_FRIEND
        );

        List<BadgeDto> nuevos = new ArrayList<>();
        LocalDateTime ahora  = LocalDateTime.now();

        for (BadgeType tipo : candidatos) {
            if (badgeRepository.existsByUserIdAndType(user.getId(), tipo)) continue;
            if (!cumpleCondicion(tipo, sesiones, rutinas, amigos, racha))  continue;

            UserBadge badge = new UserBadge();
            badge.setUser(user);
            badge.setType(tipo);
            badge.setUnlockedAt(ahora);
            badgeRepository.save(badge);
            nuevos.add(new BadgeDto(tipo, ahora));
        }
        return nuevos;
    }

    private boolean cumpleCondicion(BadgeType tipo,
                                    long sesiones, long rutinas,
                                    long amigos,   int racha) {
        return switch (tipo) {
            case FIRST_SESSION  -> sesiones >= 1;
            case SESSIONS_5     -> sesiones >= 5;
            case SESSIONS_10    -> sesiones >= 10;
            case SESSIONS_25    -> sesiones >= 25;
            case SESSIONS_50    -> sesiones >= 50;
            case STREAK_3       -> racha >= 3;
            case STREAK_7       -> racha >= 7;
            case STREAK_30      -> racha >= 30;
            case FIRST_ROUTINE  -> rutinas >= 1;
            case ROUTINES_5     -> rutinas >= 5;
            case FIRST_FRIEND   -> amigos >= 1;
            case FIRST_SHARE    -> false; // se gestiona desde ChatService
        };
    }

    private UserStreak emptyStreak(User user) {
        UserStreak s = new UserStreak();
        s.setUser(user);
        return s;
    }
}
