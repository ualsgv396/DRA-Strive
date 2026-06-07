package com.strive.backend.controller;

import com.strive.backend.dto.EjercicioLogradoDto;
import com.strive.backend.dto.ResumenProgresoDto;
import com.strive.backend.service.ProgresoService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/progreso/ejercicios              → ejercicios que el usuario ha registrado
 * GET /api/progreso/ejercicio/{exerciseId}  → serie temporal de ese ejercicio
 */
@RestController
@RequestMapping("/api/progreso")
public class ProgresoController {

    private final ProgresoService progresoService;

    public ProgresoController(ProgresoService progresoService) {
        this.progresoService = progresoService;
    }

    @GetMapping("/ejercicios")
    public List<EjercicioLogradoDto> misEjercicios() {
        return progresoService.misEjerciciosLogrados();
    }

    @GetMapping("/ejercicio/{exerciseId}")
    public ResumenProgresoDto progreso(@PathVariable Long exerciseId) {
        return progresoService.progresoPorEjercicio(exerciseId);
    }
}
