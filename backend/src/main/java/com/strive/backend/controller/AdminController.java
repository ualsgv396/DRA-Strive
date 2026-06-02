package com.strive.backend.controller;

import com.strive.backend.domain.Routine;
import com.strive.backend.domain.TrainingSession;
import com.strive.backend.domain.User;
import com.strive.backend.domain.UserRole;
import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.TrainingSessionRepository;
import com.strive.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final RoutineRepository routineRepository;
    private final TrainingSessionRepository trainingSessionRepository;

    public AdminController(UserRepository userRepository,
                           ExerciseRepository exerciseRepository,
                           RoutineRepository routineRepository,
                           TrainingSessionRepository trainingSessionRepository) {
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
        this.routineRepository = routineRepository;
        this.trainingSessionRepository = trainingSessionRepository;
    }

    // ── Legacy ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return Map.of(
            "totalUsuarios",   userRepository.count(),
            "totalEjercicios", exerciseRepository.count(),
            "totalRutinas",    routineRepository.count()
        );
    }

    // ── Dashboard overview ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard(
            @RequestParam(defaultValue = "30d") String periodo) {
        int dias = switch (periodo) {
            case "7d"  -> 7;
            case "98d" -> 98;
            case "1a"  -> 365;
            default    -> 30;
        };
        LocalDateTime now              = LocalDateTime.now();
        LocalDateTime inicioPeriodo    = now.minusDays(dias);
        LocalDateTime inicioPeriodoAnt = now.minusDays(dias * 2L);
        LocalDateTime en24Horas        = now.plusHours(24);

        long totalUsuarios   = userRepository.count();
        long totalEjercicios = exerciseRepository.count();
        long totalRutinas    = routineRepository.count();

        long usuariosNuevosEsteMes = userRepository.countByCreatedAtAfter(inicioPeriodo);
        long usuariosMesAnterior   = userRepository.countByCreatedAtBetween(inicioPeriodoAnt, inicioPeriodo);
        double tasaCrecimientoUsuarios = usuariosMesAnterior > 0
            ? Math.round((double) usuariosNuevosEsteMes / usuariosMesAnterior * 1000.0) / 10.0
            : 0.0;

        long rutinasNuevasEsteMes = routineRepository.countByCreatedAtAfter(inicioPeriodo);

        int puntosTendencia = Math.min(dias, 30);
        List<User>    usuariosRecientes = userRepository.findByCreatedAtAfterOrderByCreatedAtAsc(inicioPeriodo);
        List<Routine> rutinasRecientes  = routineRepository.findByCreatedAtAfterOrderByCreatedAtAsc(inicioPeriodo);
        List<Long> tendenciaUsuarios = contarBuckets(
            usuariosRecientes.stream().map(User::getCreatedAt).collect(Collectors.toList()), dias, puntosTendencia);
        List<Long> tendenciaRutinas = contarBuckets(
            rutinasRecientes.stream().map(Routine::getCreatedAt).collect(Collectors.toList()), dias, puntosTendencia);

        List<TrainingSession> sesionesRecientes =
            trainingSessionRepository.findByStartedAtAfterWithDetails(inicioPeriodo);

        Map<String, Long> sesionesPorDia = buildSessionChart(sesionesRecientes, dias, now);
        long totalSesiones7Dias = sesionesPorDia.values().stream().mapToLong(Long::longValue).sum();

        long sesionesSemanaAnterior = trainingSessionRepository.countByStartedAtBetween(inicioPeriodoAnt, inicioPeriodo);
        double tasaCrecimientoSesiones = sesionesSemanaAnterior > 0
            ? Math.round((double)(totalSesiones7Dias - sesionesSemanaAnterior) / sesionesSemanaAnterior * 1000.0) / 10.0
            : 0.0;

        long flashActivos             = routineRepository.countFlashActivos();
        long flashCaducanProximamente = routineRepository.countFlashCaducanAntes(en24Horas);

        List<Map<String, Object>> actividad = new ArrayList<>();

        userRepository.findTop5ByOrderByCreatedAtDesc().forEach(u -> {
            String actor = u.getNickname() != null && !u.getNickname().isBlank()
                ? "@" + u.getNickname()
                : "@" + u.getEmail().split("@")[0];
            actividad.add(eventoMap("USUARIO_NUEVO", actor, "se registró", u.getCreatedAt()));
        });

        routineRepository.findTop5WithOwner().forEach(r -> actividad.add(
            eventoMap("RUTINA_CREADA", r.getName(), r.getOwner().getFullName(), r.getCreatedAt())
        ));

        trainingSessionRepository.findTop5WithDetails().forEach(ts -> {
            String actor = ts.getUser().getNickname() != null && !ts.getUser().getNickname().isBlank()
                ? "@" + ts.getUser().getNickname()
                : ts.getUser().getFullName();
            actividad.add(eventoMap("SESION_INICIADA", ts.getRoutine().getName(), actor, ts.getStartedAt()));
        });

        actividad.sort((a, b) -> b.get("timestamp").toString().compareTo(a.get("timestamp").toString()));

        Map<String, Object> result = new HashMap<>();
        result.put("totalUsuarios",             totalUsuarios);
        result.put("totalEjercicios",            totalEjercicios);
        result.put("totalRutinas",               totalRutinas);
        result.put("totalSesiones7Dias",         totalSesiones7Dias);
        result.put("usuariosNuevosEsteMes",       usuariosNuevosEsteMes);
        result.put("tasaCrecimientoUsuarios",     tasaCrecimientoUsuarios);
        result.put("rutinasNuevasEsteMes",        rutinasNuevasEsteMes);
        result.put("tendenciaUsuarios",           tendenciaUsuarios);
        result.put("tendenciaRutinas",            tendenciaRutinas);
        result.put("sesionesPorDia",              sesionesPorDia);
        result.put("flashActivos",                flashActivos);
        result.put("flashCaducanProximamente",    flashCaducanProximamente);
        result.put("tasaCrecimientoSesiones",     tasaCrecimientoSesiones);
        result.put("actividadReciente",           actividad.stream().limit(10).collect(Collectors.toList()));
        return result;
    }

    // ── User management ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @GetMapping("/users/stats")
    public Map<String, Object> getUserStats() {
        LocalDateTime now        = LocalDateTime.now();
        LocalDateTime hace7Dias  = now.minusDays(7);
        LocalDateTime hace14Dias = now.minusDays(14);
        LocalDateTime hace30Dias = now.minusDays(30);

        long total        = userRepository.count();
        long suspendidos  = userRepository.countBySuspendedTrue();
        long nuevos7d     = userRepository.countByCreatedAtAfter(hace7Dias);
        long nuevos14d    = userRepository.countByCreatedAtBetween(hace14Dias, hace7Dias);
        double tasaNuevos = nuevos14d > 0
            ? Math.round((double)(nuevos7d - nuevos14d) / nuevos14d * 1000.0) / 10.0
            : 0.0;

        long activos30d   = trainingSessionRepository.countDistinctUsersSince(hace30Dias);
        double tasaActivos = total > 0
            ? Math.round((double) activos30d / total * 1000.0) / 10.0
            : 0.0;

        Map<String, Object> result = new HashMap<>();
        result.put("total",          total);
        result.put("activos30d",     activos30d);
        result.put("tasaActivos30d", tasaActivos);
        result.put("nuevos7d",       nuevos7d);
        result.put("tasaNuevos7d",   tasaNuevos);
        result.put("suspendidos",    suspendidos);
        return result;
    }

    @Transactional(readOnly = true)
    @GetMapping("/users")
    public Map<String, Object> getUsers(
            @RequestParam(defaultValue = "")      String search,
            @RequestParam(defaultValue = "TODOS") String status,
            @RequestParam(defaultValue = "TODOS") String role,
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "25")    int size) {

        LocalDateTime now        = LocalDateTime.now();
        LocalDateTime hace7Dias  = now.minusDays(7);
        LocalDateTime hace30Dias = now.minusDays(30);

        Specification<User> spec = buildUserSpec(search, status, role, hace7Dias, hace30Dias);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());

        Page<User> pagina = userRepository.findAll(spec, pageable);
        List<User> usuarios = pagina.getContent();
        List<Long> ids = usuarios.stream().map(User::getId).collect(Collectors.toList());

        Map<Long, Long> rutinasPor   = new HashMap<>();
        Map<Long, Long> sesionesPor  = new HashMap<>();
        Map<Long, LocalDateTime> ultimaSesionPor = new HashMap<>();

        if (!ids.isEmpty()) {
            routineRepository.countByOwnerIds(ids).forEach(row -> {
                if (row[0] != null && row[1] != null)
                    rutinasPor.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            });
            trainingSessionRepository.countByUserIds(ids).forEach(row -> {
                if (row[0] != null && row[1] != null)
                    sesionesPor.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            });
            trainingSessionRepository.findLastSessionDateByUserIds(ids).forEach(row -> {
                if (row[0] != null && row[1] != null)
                    ultimaSesionPor.put(((Number) row[0]).longValue(), (LocalDateTime) row[1]);
            });
        }

        List<Map<String, Object>> content = usuarios.stream().map(u -> {
            LocalDateTime ultimaSession = ultimaSesionPor.get(u.getId());
            LocalDateTime lastLogin     = u.getLastLoginAt();
            LocalDateTime ultimaVez     = (ultimaSession != null && (lastLogin == null || ultimaSession.isAfter(lastLogin)))
                ? ultimaSession : lastLogin;

            Map<String, Object> dto = new HashMap<>();
            dto.put("id",              u.getId());
            dto.put("fullName",        u.getFullName());
            dto.put("nickname",        u.getNickname());
            dto.put("email",           u.getEmail());
            dto.put("role",            u.getRole().name());
            dto.put("rutinasCount",    rutinasPor.getOrDefault(u.getId(), 0L));
            dto.put("sesionesCount",   sesionesPor.getOrDefault(u.getId(), 0L));
            dto.put("suspended",       u.isSuspended());
            dto.put("suspendedReason", u.getSuspendedReason());
            dto.put("suspendedAt",     u.getSuspendedAt());
            dto.put("createdAt",       u.getCreatedAt());
            dto.put("lastSeenAt",      ultimaVez);
            dto.put("status",          computarStatus(u, ultimaVez, hace7Dias, hace30Dias));
            return dto;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("content",       content);
        result.put("totalElements", pagina.getTotalElements());
        result.put("page",          page);
        result.put("size",          size);
        result.put("totalPages",    pagina.getTotalPages());
        return result;
    }

    @PatchMapping("/users/{id}/suspend")
    public ResponseEntity<Void> suspendUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User u = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (u.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No se puede suspender a un administrador");
        }
        u.setSuspended(true);
        u.setSuspendedReason(body.get("reason"));
        u.setSuspendedAt(LocalDateTime.now());
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Void> activateUser(@PathVariable Long id) {
        User u = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        u.setSuspended(false);
        u.setSuspendedReason(null);
        u.setSuspendedAt(null);
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @Transactional
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User u = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (u.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No se puede eliminar a un administrador");
        }
        userRepository.delete(u);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Void> changeUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        UserRole nuevoRol;
        try {
            nuevoRol = UserRole.valueOf(body.getOrDefault("role", "").toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol inválido");
        }
        User u = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (u.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No se puede modificar el rol de un administrador");
        }
        u.setRole(nuevoRol);
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Specification<User> buildUserSpec(String search, String status, String role,
                                               LocalDateTime hace7Dias, LocalDateTime hace30Dias) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();

            if (!search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                preds.add(cb.or(
                    cb.like(cb.lower(root.get("fullName")), like),
                    cb.like(cb.lower(root.get("email")),    like),
                    cb.like(cb.lower(root.get("nickname")), like)
                ));
            }

            switch (status.toUpperCase()) {
                case "ACTIVOS" -> preds.add(cb.and(
                    cb.equal(root.get("suspended"), false),
                    cb.greaterThan(root.get("lastLoginAt"), hace30Dias)
                ));
                case "NUEVOS" -> preds.add(cb.and(
                    cb.equal(root.get("suspended"), false),
                    cb.greaterThan(root.get("createdAt"), hace7Dias)
                ));
                case "SUSPENDIDOS" -> preds.add(cb.equal(root.get("suspended"), true));
                case "INACTIVOS" -> preds.add(cb.and(
                    cb.equal(root.get("suspended"), false),
                    cb.or(
                        cb.isNull(root.get("lastLoginAt")),
                        cb.lessThanOrEqualTo(root.get("lastLoginAt"), hace30Dias)
                    ),
                    cb.lessThanOrEqualTo(root.get("createdAt"), hace7Dias)
                ));
            }

            if (!role.equalsIgnoreCase("TODOS")) {
                try {
                    preds.add(cb.equal(root.get("role"), UserRole.valueOf(role.toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private String computarStatus(User u, LocalDateTime ultimaVez,
                                   LocalDateTime hace7Dias, LocalDateTime hace30Dias) {
        if (u.isSuspended()) return "SUSPENDIDO";
        if (u.getCreatedAt().isAfter(hace7Dias)) return "NUEVO";
        if (ultimaVez != null && ultimaVez.isAfter(hace30Dias)) return "ACTIVO";
        return "INACTIVO";
    }

    private Map<String, Long> buildSessionChart(
            List<TrainingSession> sesiones, int dias, LocalDateTime now) {
        if (dias <= 30) {
            Map<String, Long> result = new LinkedHashMap<>();
            for (int i = dias - 1; i >= 0; i--)
                result.put(now.minusDays(i).toLocalDate().toString(), 0L);
            for (TrainingSession ts : sesiones) {
                String dia = ts.getStartedAt().toLocalDate().toString();
                result.computeIfPresent(dia, (k, v) -> v + 1);
            }
            return result;
        }
        if (dias <= 98) {
            int semanas = dias / 7;
            Map<String, Long> result = new LinkedHashMap<>();
            for (int i = semanas - 1; i >= 0; i--)
                result.put(now.minusDays((long)(i + 1) * 7).toLocalDate().toString(), 0L);
            for (TrainingSession ts : sesiones) {
                long daysAgo = ChronoUnit.DAYS.between(ts.getStartedAt().toLocalDate(), now.toLocalDate());
                int semana = (int)(daysAgo / 7);
                if (semana < semanas) {
                    String key = now.minusDays((long)(semana + 1) * 7).toLocalDate().toString();
                    result.merge(key, 1L, Long::sum);
                }
            }
            return result;
        }
        Map<String, Long> result = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--)
            result.put(now.toLocalDate().minusMonths(i).withDayOfMonth(1).toString(), 0L);
        for (TrainingSession ts : sesiones) {
            String mes = ts.getStartedAt().toLocalDate().withDayOfMonth(1).toString();
            result.merge(mes, 1L, Long::sum);
        }
        return result;
    }

    private List<Long> contarBuckets(List<LocalDateTime> timestamps, int dias, int numBuckets) {
        LocalDateTime ahora = LocalDateTime.now();
        double duracion = (double) dias / numBuckets;
        List<Long> result = new ArrayList<>();
        for (int i = 0; i < numBuckets; i++) {
            LocalDateTime ini = ahora.minusDays(Math.round((numBuckets - i) * duracion));
            LocalDateTime fin = ahora.minusDays(Math.round((numBuckets - 1 - i) * duracion));
            long count = timestamps.stream()
                .filter(ts -> !ts.isBefore(ini) && ts.isBefore(fin))
                .count();
            result.add(count);
        }
        return result;
    }

    private Map<String, Object> eventoMap(String tipo, String actor, String descripcion, LocalDateTime ts) {
        Map<String, Object> m = new HashMap<>();
        m.put("tipo",        tipo);
        m.put("actor",       actor);
        m.put("descripcion", descripcion);
        m.put("timestamp",   ts.toString());
        return m;
    }
}
