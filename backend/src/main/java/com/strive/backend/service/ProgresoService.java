package com.strive.backend.service;

import com.strive.backend.domain.TrainingExerciseRecord;
import com.strive.backend.domain.TrainingSessionStatus;
import com.strive.backend.domain.User;
import com.strive.backend.dto.EjercicioLogradoDto;
import com.strive.backend.dto.PuntoProgresoDto;
import com.strive.backend.dto.ResumenProgresoDto;
import com.strive.backend.repository.TrainingExerciseRecordRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ProgresoService {

    private final TrainingExerciseRecordRepository recordRepository;
    private final CurrentUserService               currentUserService;

    public ProgresoService(TrainingExerciseRecordRepository recordRepository,
                           CurrentUserService currentUserService) {
        this.recordRepository  = recordRepository;
        this.currentUserService = currentUserService;
    }

    /** Ejercicios que el usuario ha entrenado al menos una vez, para el selector. */
    public List<EjercicioLogradoDto> misEjerciciosLogrados() {
        User yo = currentUserService.getCurrentUser();
        return recordRepository
            .findDistinctExercisesByUser(yo.getId(), TrainingSessionStatus.COMPLETED)
            .stream()
            .map(e -> new EjercicioLogradoDto(e.getId(), e.getTitle()))
            .toList();
    }

    /** Serie temporal de carga/reps para un ejercicio concreto del usuario. */
    public ResumenProgresoDto progresoPorEjercicio(Long exerciseId) {
        User yo = currentUserService.getCurrentUser();

        List<TrainingExerciseRecord> registros = recordRepository
            .findByUserAndExercise(yo.getId(), exerciseId, TrainingSessionStatus.COMPLETED);

        if (registros.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Sin registros para este ejercicio");
        }

        // Agrupar por fecha de sesión (TreeMap = orden cronológico garantizado)
        Map<LocalDate, List<TrainingExerciseRecord>> porFecha = new LinkedHashMap<>();
        for (TrainingExerciseRecord rec : registros) {
            LocalDate fecha = rec.getTrainingSession().getCompletedAt().toLocalDate();
            porFecha.computeIfAbsent(fecha, k -> new ArrayList<>()).add(rec);
        }

        // Construir puntos: por sesión, el registro con mayor carga
        String unidad = registros.get(0).getLoadUnit();
        BigDecimal runningMax = null;
        LocalDate  fechaRecord = null;
        List<PuntoProgresoDto> puntos = new ArrayList<>();

        for (Map.Entry<LocalDate, List<TrainingExerciseRecord>> entrada : porFecha.entrySet()) {
            LocalDate fecha = entrada.getKey();

            // El "mejor" registro de esa sesión es el de mayor carga;
            // si no hay carga (bodyweight), el de más reps.
            TrainingExerciseRecord mejor = entrada.getValue().stream()
                .max(Comparator
                    .comparing(r -> r.getLoadCompleted() != null
                        ? r.getLoadCompleted()
                        : BigDecimal.valueOf(r.getRepsCompleted())))
                .orElse(entrada.getValue().get(0));

            BigDecimal carga  = mejor.getLoadCompleted();
            boolean    esPR   = false;

            if (carga != null) {
                if (runningMax == null || carga.compareTo(runningMax) > 0) {
                    runningMax  = carga;
                    fechaRecord = fecha;
                    esPR        = true;
                }
            }

            puntos.add(new PuntoProgresoDto(
                fecha,
                carga,
                mejor.getRepsCompleted(),
                mejor.getSetsCompleted(),
                mejor.getLoadUnit() != null ? mejor.getLoadUnit() : unidad,
                esPR
            ));
        }

        String nombreEjercicio = registros.get(0)
            .getRoutineExercise().getExercise().getTitle();

        return new ResumenProgresoDto(
            exerciseId,
            nombreEjercicio,
            unidad != null ? unidad : "KG",
            puntos,
            runningMax,
            fechaRecord,
            porFecha.size()
        );
    }
}
