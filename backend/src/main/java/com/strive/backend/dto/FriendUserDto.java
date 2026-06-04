package com.strive.backend.dto;

public record FriendUserDto(
        Long id,
        String fullName,
        String nickname,
        boolean online
) {
  
    public FriendUserDto(Long id, String fullName, String nickname) {
        this(id, fullName, nickname, false);
    }
}
