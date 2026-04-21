package com.strive.backend.config;

import com.strive.backend.domain.Exercise;
import com.strive.backend.domain.ExerciseType;
import com.strive.backend.domain.User;
import com.strive.backend.domain.UserRole;
import com.strive.backend.repository.ExerciseRepository;
import com.strive.backend.repository.UserRepository;
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
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);

                User user = new User();
                user.setEmail("user@strive.com");
                user.setPasswordHash(passwordEncoder.encode("user123"));
                user.setFullName("User Strive");
                user.setRole(UserRole.USER);
                userRepository.save(user);
            }

            if (exerciseRepository.count() == 0) {
                Exercise squat = new Exercise();
                squat.setTitle("Sentadilla");
                squat.setImageUrl("https://images.example.com/squat.jpg");
                squat.setType(ExerciseType.STRENGTH);
                squat.setDescription("Ejercicio base para tren inferior.");
                exerciseRepository.save(squat);

                Exercise benchPress = new Exercise();
                benchPress.setTitle("Press de banca");
                benchPress.setImageUrl("https://images.example.com/bench-press.jpg");
                benchPress.setType(ExerciseType.HYPERTROPHY);
                benchPress.setDescription("Movimiento principal de empuje horizontal.");
                exerciseRepository.save(benchPress);
            }
        };
    }
}
