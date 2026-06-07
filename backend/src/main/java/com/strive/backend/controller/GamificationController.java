package com.strive.backend.controller;

import com.strive.backend.dto.GamificationDto;
import com.strive.backend.service.GamificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone los datos de gamificación del usuario autenticado.
 *
 * GET /api/gamification/me → racha actual, racha más larga, fecha último entreno,
 *                            lista completa de logros desbloqueados.
 */
@RestController
@RequestMapping("/api/gamification")
public class GamificationController {

    private final GamificationService gamificationService;

    public GamificationController(GamificationService gamificationService) {
        this.gamificationService = gamificationService;
    }

    @GetMapping("/me")
    public GamificationDto miGamificacion() {
        return gamificationService.obtenerMiGamificacion();
    }
}
