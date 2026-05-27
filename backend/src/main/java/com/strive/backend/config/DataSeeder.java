package com.strive.backend.config;

import com.strive.backend.domain.Difficulty;
import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.domain.User;
import com.strive.backend.domain.UserRole;
import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.UserRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedInitialData(
            UserRepository userRepository,
            ExerciseRepository exerciseRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setEmail("admin@strive.com");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setFullName("Admin Strive");
                admin.setNickname("admin");
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);

                User user = new User();
                user.setEmail("user@strive.com");
                user.setPasswordHash(passwordEncoder.encode("user123"));
                user.setFullName("User Strive");
                user.setNickname("user");
                user.setRole(UserRole.USER);
                userRepository.save(user);
            }

            userRepository.findAll().forEach(existingUser -> {
                if (existingUser.getNickname() == null || existingUser.getNickname().isBlank()) {
                    existingUser.setNickname(existingUser.getEmail().split("@")[0].toLowerCase());
                    userRepository.save(existingUser);
                }
            });

            if (exerciseRepository.count() == 0) {
                seedEjercicio(exerciseRepository, "Sentadilla",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Squats.jpg/640px-Squats.jpg",
                    ExerciseType.FUERZA, Difficulty.PRINCIPIANTE,
                    "Ejercicio base para tren inferior. Mantén la espalda recta y rodillas alineadas con los pies.",
                    List.of("Cuádriceps", "Glúteos", "Isquiotibiales"));

                seedEjercicio(exerciseRepository, "Press de banca",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Bench_press_2.jpg/640px-Bench_press_2.jpg",
                    ExerciseType.FUERZA, Difficulty.INTERMEDIO,
                    "Movimiento principal de empuje horizontal. Controla el descenso y empuja explosivo.",
                    List.of("Pecho", "Tríceps", "Hombros anteriores"));

                seedEjercicio(exerciseRepository, "Peso muerto",
                    null, ExerciseType.FUERZA, Difficulty.AVANZADO,
                    "Movimiento de bisagra de cadera. Exige técnica precisa para proteger la zona lumbar.",
                    List.of("Isquiotibiales", "Glúteos", "Espalda baja", "Trapecios"));

                seedEjercicio(exerciseRepository, "Dominadas",
                    null, ExerciseType.FUERZA, Difficulty.INTERMEDIO,
                    "Tirón vertical con peso corporal. Clave para la anchura de espalda.",
                    List.of("Dorsal", "Bíceps", "Romboides"));

                seedEjercicio(exerciseRepository, "Press militar",
                    null, ExerciseType.FUERZA, Difficulty.INTERMEDIO,
                    "Empuje vertical con barra. Desarrolla los hombros y estabilidad del core.",
                    List.of("Hombros", "Tríceps", "Core"));

                seedEjercicio(exerciseRepository, "Zancadas",
                    null, ExerciseType.FUERZA, Difficulty.PRINCIPIANTE,
                    "Ejercicio unilateral para piernas. Mejora equilibrio y simetría.",
                    List.of("Cuádriceps", "Glúteos", "Isquiotibiales"));

                seedEjercicio(exerciseRepository, "Remo con barra",
                    null, ExerciseType.FUERZA, Difficulty.INTERMEDIO,
                    "Tirón horizontal clave para el grosor de espalda.",
                    List.of("Dorsal", "Romboides", "Bíceps", "Trapecios"));

                seedEjercicio(exerciseRepository, "Carrera continua",
                    null, ExerciseType.CARDIO, Difficulty.PRINCIPIANTE,
                    "Cardio de resistencia aeróbica a ritmo constante.",
                    List.of("Cardio", "Cuádriceps", "Gemelos"));

                seedEjercicio(exerciseRepository, "HIIT en bicicleta",
                    null, ExerciseType.CARDIO, Difficulty.AVANZADO,
                    "Intervalos de alta intensidad en cicloergómetro. Alterna sprints con recuperación.",
                    List.of("Cardio", "Cuádriceps", "Glúteos"));

                seedEjercicio(exerciseRepository, "Saltar la comba",
                    null, ExerciseType.CARDIO, Difficulty.PRINCIPIANTE,
                    "Cardio de impacto bajo-moderado con excelente relación coste-beneficio.",
                    List.of("Cardio", "Gemelos", "Hombros"));

                seedEjercicio(exerciseRepository, "Movilidad de cadera",
                    null, ExerciseType.MOVILIDAD, Difficulty.PRINCIPIANTE,
                    "Rutina de apertura y rotación de cadera para mejorar el rango de movimiento.",
                    List.of("Cadera", "Aductores", "Glúteos"));

                seedEjercicio(exerciseRepository, "Estiramientos de columna",
                    null, ExerciseType.MOVILIDAD, Difficulty.PRINCIPIANTE,
                    "Movilización de la columna torácica y lumbar. Ideal como calentamiento o vuelta a la calma.",
                    List.of("Columna", "Core", "Espalda baja"));
            }
        };
    }

    private void seedEjercicio(ExerciseRepository repo, String title, String imageUrl,
                                ExerciseType type, Difficulty difficulty,
                                String description, List<String> muscleGroups) {
        Exercise e = new Exercise();
        e.setTitle(title);
        e.setImageUrl(imageUrl);
        e.setType(type);
        e.setDifficulty(difficulty);
        e.setDescription(description);
        e.setMuscleGroups(muscleGroups);
        repo.save(e);
    }
}
