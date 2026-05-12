package com.strive.backend.dto;

public record FriendSearchResultDto(
        Long id,
        String fullName,
        String nickname,
        String relation
) {
}
