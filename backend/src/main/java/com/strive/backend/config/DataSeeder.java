package com.strive.backend.config;

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
                Exercise squat = new Exercise();
                squat.setTitle("Sentadilla");
                squat.setImageUrl("https://images.example.com/squat.jpg");
                squat.setType(ExerciseType.FUERZA);
                squat.setDescription("Ejercicio base para tren inferior.");
                squat.setMuscleGroups(List.of("Cuádriceps", "Glúteos", "Piernas"));
                exerciseRepository.save(squat);

                Exercise bench = new Exercise();
                bench.setTitle("Press de banca");
                bench.setImageUrl("https://images.example.com/bench-press.jpg");
                bench.setType(ExerciseType.FUERZA);
                bench.setDescription("Movimiento principal de empuje horizontal.");
                bench.setMuscleGroups(List.of("Pecho", "Tríceps", "Hombros"));
                exerciseRepository.save(bench);

                Exercise run = new Exercise();
                run.setTitle("Carrera continua");
                run.setImageUrl("");
                run.setType(ExerciseType.CARDIO);
                run.setDescription("Cardio de resistencia aeróbica.");
                run.setMuscleGroups(List.of("Cardio", "Piernas"));
                exerciseRepository.save(run);
            }
        };
    }
}
