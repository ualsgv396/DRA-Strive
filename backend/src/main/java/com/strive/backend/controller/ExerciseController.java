package com.strive.backend.controller;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.dto.CreateExerciseRequest;
import com.strive.backend.service.ExerciseService;
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

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping
    public List<Exercise> list(@RequestParam(required = false) ExerciseType type) {
        return exerciseService.findAll(type);
    }

    @GetMapping("/{id}")
    public Exercise getById(@PathVariable Long id) {
        return exerciseService.findById(id)
            .orElseThrow(() -> new RuntimeException("Exercise not found with id: " + id));
    }

    @GetMapping("/search")
    public List<Exercise> search(@RequestParam String q) {
        return exerciseService.searchByTitle(q);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Exercise create(@Valid @RequestBody CreateExerciseRequest request) {
        return exerciseService.create(request);
    }

    @PutMapping("/{id}")
    public Exercise update(@PathVariable Long id, @Valid @RequestBody CreateExerciseRequest request) {
        return exerciseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        exerciseService.delete(id);
    }

    @PostMapping("/sync/external")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void syncExercisesFromExternal(@RequestParam(defaultValue = "100") int limit) {
        exerciseService.syncExercisesFromExternalAPI(limit);
    }

    @PostMapping("/sync/bodypart/{bodyPart}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void syncByBodyPart(@PathVariable String bodyPart) {
        exerciseService.syncExercisesByBodyPart(bodyPart);
    }

    @GetMapping("/bodyparts")
    public List<String> getBodyParts() {
        return exerciseService.getAllBodyParts();
    }
}
