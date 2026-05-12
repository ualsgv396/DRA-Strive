package com.strive.backend.controller;

import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.RoutineRepository;
import com.strive.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final RoutineRepository routineRepository;

    public AdminController(UserRepository userRepository,
                           ExerciseRepository exerciseRepository,
                           RoutineRepository routineRepository) {
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
        this.routineRepository = routineRepository;
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return Map.of(
            "totalUsuarios",   userRepository.count(),
            "totalEjercicios", exerciseRepository.count(),
            "totalRutinas",    routineRepository.count()
        );
    }
}
