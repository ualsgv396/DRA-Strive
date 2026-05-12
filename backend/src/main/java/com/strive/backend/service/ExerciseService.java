package com.strive.backend.service;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.dto.CreateExerciseRequest;
import com.strive.backend.dto.ExternalExerciseDto;
import com.strive.backend.repository.ExerciseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseApiIntegrationService apiIntegrationService;

    public ExerciseService(ExerciseRepository exerciseRepository, ExerciseApiIntegrationService apiIntegrationService) {
        this.exerciseRepository = exerciseRepository;
        this.apiIntegrationService = apiIntegrationService;
    }

    // --- MÉTODOS DE CONSULTA ---

    public List<Exercise> findAll(ExerciseType type) {
        if (type == null) return exerciseRepository.findAll();
        return exerciseRepository.findByType(type);
    }

    public Optional<Exercise> findById(Long id) {
        return exerciseRepository.findById(id);
    }

    public List<Exercise> searchByTitle(String title) {
        return exerciseRepository.findByTitleContainingIgnoreCase(title);
    }

    // --- MÉTODOS DE ESCRITURA MANUAL ---

    @Transactional
    public Exercise create(CreateExerciseRequest request) {
        Exercise exercise = new Exercise();
        exercise.setTitle(request.title());
        exercise.setImageUrl(request.imageUrl());
        exercise.setType(request.type());
        exercise.setDescription(request.description());
        exercise.setDifficulty(request.difficulty());
        if (request.muscleGroups() != null) {
            exercise.setMuscleGroups(request.muscleGroups());
        }
        return exerciseRepository.save(exercise);
    }

    @Transactional
    public Exercise update(Long id, CreateExerciseRequest request) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found with id: " + id));
        exercise.setTitle(request.title());
        exercise.setImageUrl(request.imageUrl());
        exercise.setType(request.type());
        exercise.setDescription(request.description());
        exercise.setDifficulty(request.difficulty());
        if (request.muscleGroups() != null) {
            exercise.setMuscleGroups(request.muscleGroups());
        }
        return exerciseRepository.save(exercise);
    }

    @Transactional
    public void delete(Long id) {
        if (!exerciseRepository.existsById(id)) {
            throw new RuntimeException("Exercise not found with id: " + id);
        }
        exerciseRepository.deleteById(id);
    }

    // --- MÉTODOS DE SINCRONIZACIÓN ASÍNCRONA ---

    @Async
    @Transactional
    public void syncExercisesFromExternalAPI(int limit) {
        log.info("Iniciando sincronización externa con límite de {} ejercicios...", limit);
        try {
            List<ExternalExerciseDto> external = apiIntegrationService.fetchExercises(limit);
            int savedCount = 0;
            for (ExternalExerciseDto dto : external) {
                if (!exerciseRepository.existsByTitle(dto.getName())) {
                    exerciseRepository.save(buildExercise(dto));
                    savedCount++;
                }
            }
            log.info("Sincronización finalizada: {} ejercicios procesados, {} nuevos guardados.", external.size(), savedCount);
        } catch (Exception e) {
            log.error("Error crítico durante la sincronización externa: {}", e.getMessage());
        }
    }

    @Async
    @Transactional
    public void syncExercisesByBodyPart(String bodyPart) {
        log.info("Iniciando sincronización para la parte del cuerpo: {}", bodyPart);
        try {
            List<ExternalExerciseDto> external = apiIntegrationService.getExercisesByBodyPart(bodyPart);
            int savedCount = 0;
            for (ExternalExerciseDto dto : external) {
                if (!exerciseRepository.existsByTitle(dto.getName())) {
                    exerciseRepository.save(buildExercise(dto));
                    savedCount++;
                }
            }
            log.info("Sincronización por parte del cuerpo ({}) completada. Nuevos: {}", bodyPart, savedCount);
        } catch (Exception e) {
            log.error("Error sincronizando parte del cuerpo {}: {}", bodyPart, e.getMessage());
        }
    }

    public List<String> getAllBodyParts() {
        return apiIntegrationService.getAllBodyParts();
    }

    // --- MÉTODOS PRIVADOS DE MAPEO Y TRADUCCIÓN ---

    private Exercise buildExercise(ExternalExerciseDto dto) {
        Exercise exercise = new Exercise();
        exercise.setTitle(dto.getName());
        exercise.setImageUrl(dto.getGifUrl());
        exercise.setType(mapExerciseType(dto.getBodyPart(), dto.getTarget()));
        exercise.setDescription(buildDescription(dto));
        exercise.setMuscleGroups(buildMuscleGroups(dto.getBodyPart(), dto.getTarget()));
        return exercise;
    }

    private String buildDescription(ExternalExerciseDto dto) {
        return String.format("Grupo: %s | Músculo objetivo: %s | Equipamiento: %s",
                dto.getBodyPart(), dto.getTarget(), dto.getEquipment());
    }

    private ExerciseType mapExerciseType(String bodyPart, String target) {
        if (bodyPart == null) return ExerciseType.FUERZA;
        return switch (bodyPart.toLowerCase()) {
            case "cardio" -> ExerciseType.CARDIO;
            default -> ExerciseType.FUERZA;
        };
    }

    private List<String> buildMuscleGroups(String bodyPart, String target) {
        List<String> groups = new ArrayList<>();
        String bp = translateBodyPart(bodyPart);
        String tg = translateTarget(target);
        if (bp != null) groups.add(bp);
        if (tg != null && !tg.equals(bp)) groups.add(tg);
        return groups;
    }

    private String translateBodyPart(String bodyPart) {
        if (bodyPart == null) return null;
        return switch (bodyPart.toLowerCase()) {
            case "back"        -> "Espalda";
            case "cardio"      -> "Cardio";
            case "chest"       -> "Pecho";
            case "lower arms"  -> "Antebrazos";
            case "lower legs"  -> "Piernas";
            case "neck"        -> "Cuello";
            case "shoulders"   -> "Hombros";
            case "upper arms"  -> "Brazos";
            case "upper legs"  -> "Piernas";
            case "waist"       -> "Core";
            case "arms"        -> "Brazos";
            case "legs"        -> "Piernas";
            case "abs"         -> "Abdominales";
            case "glutes"      -> "Glúteos";
            case "calves"      -> "Pantorrillas";
            default            -> null;
        };
    }

    private String translateTarget(String target) {
        if (target == null) return null;
        return switch (target.toLowerCase()) {
            case "abs"                   -> "Abdominales";
            case "adductors"             -> "Aductores";
            case "biceps"                -> "Bíceps";
            case "calves"                -> "Pantorrillas";
            case "cardiovascular system" -> "Cardio";
            case "delts"                 -> "Deltoides";
            case "erector spinae"        -> "Espalda";
            case "forearms"              -> "Antebrazos";
            case "glutes"                -> "Glúteos";
            case "hamstrings"            -> "Isquiotibiales";
            case "lats"                  -> "Dorsales";
            case "levator scapulae"      -> "Cuello";
            case "pectorals"             -> "Pecho";
            case "quads"                 -> "Cuádriceps";
            case "serratus anterior"     -> "Serrato";
            case "spine"                 -> "Columna";
            case "traps"                 -> "Trapecios";
            case "triceps"               -> "Tríceps";
            case "upper back"            -> "Espalda alta";
            case "biceps brachii"        -> "Bíceps";
            case "triceps brachii"       -> "Tríceps";
            case "anterior deltoid"      -> "Deltoides";
            case "quadriceps femoris"    -> "Cuádriceps";
            case "gluteus maximus"       -> "Glúteos";
            case "gastrocnemius"         -> "Pantorrillas";
            case "pectoralis major"      -> "Pecho";
            case "latissimus dorsi"      -> "Dorsales";
            case "trapezius"             -> "Trapecios";
            case "rectus abdominis"      -> "Abdominales";
            case "obliques"              -> "Oblicuos";
            case "soleus"                -> "Sóleo";
            case "brachialis"            -> "Braquial";
            case "iliopsoas"             -> "Psoas";
            case "brachioradialis"       -> "Braquiorradial";
            case "infraspinatus"         -> "Infraespinoso";
            case "supraspinatus"         -> "Supraespinoso";
            case "teres major"           -> "Redondo mayor";
            case "rhomboids"             -> "Romboides";
            default                      -> null;
        };
    }
}