package com.strive.backend.controller;

import com.strive.backend.dto.FeedItemDto;
import com.strive.backend.dto.ReaccionDto;
import com.strive.backend.dto.ToggleReaccionRequest;
import com.strive.backend.service.FeedService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET  /api/feed                           → feed de amigos (20 últimas sesiones)
 * POST /api/feed/{sessionId}/reaction      → toggle de reacción emoji
 */
@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    public List<FeedItemDto> feed() {
        return feedService.obtenerFeed();
    }

    @PostMapping("/{sessionId}/reaction")
    public List<ReaccionDto> toggleReaccion(
            @PathVariable Long sessionId,
            @Valid @RequestBody ToggleReaccionRequest request) {
        return feedService.toggleReaccion(sessionId, request.emoji());
    }
}
