package com.strive.backend.controller;

import com.strive.backend.dto.CreateFriendRequestDto;
import com.strive.backend.dto.FriendInviteDto;
import com.strive.backend.dto.FriendRequestDto;
import com.strive.backend.dto.FriendSearchResultDto;
import com.strive.backend.dto.FriendUserDto;
import com.strive.backend.service.FriendService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public List<FriendUserDto> listFriends(Authentication authentication) {
        return friendService.listFriends(authentication);
    }

    @GetMapping("/search")
    public List<FriendSearchResultDto> searchByNickname(
            Authentication authentication,
            @RequestParam String nickname
    ) {
        return friendService.searchByNickname(authentication, nickname);
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public void sendRequest(Authentication authentication, @Valid @RequestBody CreateFriendRequestDto request) {
        friendService.sendFriendRequest(authentication, request);
    }

    @GetMapping("/requests/incoming")
    public List<FriendRequestDto> incomingRequests(Authentication authentication) {
        return friendService.listIncomingRequests(authentication);
    }

    @PostMapping("/requests/{requestId}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptRequest(Authentication authentication, @PathVariable Long requestId) {
        friendService.acceptRequest(authentication, requestId);
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public FriendInviteDto createInvitation(Authentication authentication) {
        return friendService.createInvite(authentication);
    }

    @PostMapping("/invitations/{token}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptInvitation(Authentication authentication, @PathVariable String token) {
        friendService.acceptInvite(authentication, token);
    }
}
