package com.strive.backend.service;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.dto.CreateExerciseRequest;
import com.strive.backend.repository.ExerciseRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public ExerciseService(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    public List<Exercise> findAll(ExerciseType type) {
        if (type == null) {
            return exerciseRepository.findAll();
        }
        return exerciseRepository.findByType(type);
    }

    public Exercise create(CreateExerciseRequest request) {
        Exercise exercise = new Exercise();
        exercise.setTitle(request.title());
        exercise.setImageUrl(request.imageUrl());
        exercise.setType(request.type());
        exercise.setDescription(request.description());
        return exerciseRepository.save(exercise);
    }
}
