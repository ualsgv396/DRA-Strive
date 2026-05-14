package com.strive.backend.auth;

import com.strive.backend.domain.User;
import com.strive.backend.domain.UserRole;
import com.strive.backend.repository.UserRepository;
import com.strive.backend.security.JwtService;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (userRepository.findByNicknameIgnoreCase(request.nickname().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nickname already in use");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setNickname(request.nickname().trim().toLowerCase());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getEmail(), saved.getRole().name());
        return new AuthResponse(
                token,
                "Bearer",
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getNickname(),
                saved.getRole().name()
        );
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.isSuspended()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cuenta suspendida");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getNickname(),
                user.getRole().name()
        );
    }
}
