package com.strive.backend.config;

import com.strive.backend.service.RoutineService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FlashCleanupScheduler {

    private final RoutineService routineService;

    public FlashCleanupScheduler(RoutineService routineService) {
        this.routineService = routineService;
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanupExpiredFlashRoutines() {
        routineService.deactivateExpiredFlashRoutines();
    }
}
