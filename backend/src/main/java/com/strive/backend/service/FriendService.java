package com.strive.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.strive.backend.domain.FriendInviteToken;
import com.strive.backend.domain.Friendship;
import com.strive.backend.domain.FriendshipStatus;
import com.strive.backend.domain.User;
import com.strive.backend.dto.CreateFriendRequestDto;
import com.strive.backend.dto.FriendInviteDto;
import com.strive.backend.dto.FriendRequestDto;
import com.strive.backend.dto.FriendSearchResultDto;
import com.strive.backend.dto.FriendUserDto;
import com.strive.backend.repository.FriendInviteTokenRepository;
import com.strive.backend.repository.FriendshipRepository;
import com.strive.backend.repository.UserRepository;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FriendService {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendInviteTokenRepository inviteTokenRepository;
    private final PresenceService presenceService;

    @Value("${app.invites.base-url:http://localhost:5173/amigos?invite=}")
    private String inviteBaseUrl;

    @Value("${app.invites.expiration-minutes:30}")
    private long inviteExpirationMinutes;

    public FriendService(
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            FriendInviteTokenRepository inviteTokenRepository,
            PresenceService presenceService
    ) {
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.inviteTokenRepository = inviteTokenRepository;
        this.presenceService = presenceService;
    }

    public List<FriendUserDto> listFriends(Authentication authentication) {
        User current = getCurrentUser(authentication);
        List<Friendship> relations = friendshipRepository.findAcceptedFriendshipsForUser(current.getId());

        return relations.stream()
                .map(relation -> relation.getRequester().getId().equals(current.getId())
                        ? relation.getAddressee()
                        : relation.getRequester())
                .map(this::toFriendUserConPresencia)
                .toList();
    }

    public List<FriendSearchResultDto> searchByNickname(Authentication authentication, String nickname) {
        User current = getCurrentUser(authentication);
        String term = nickname == null ? "" : nickname.trim();
        if (term.isEmpty()) {
            return List.of();
        }

        return userRepository.findTop10ByNicknameContainingIgnoreCaseOrderByNicknameAsc(term).stream()
                .filter(user -> !user.getId().equals(current.getId()))
                .map(user -> new FriendSearchResultDto(
                        user.getId(),
                        user.getFullName(),
                        user.getNickname(),
                        resolveRelation(current.getId(), user.getId())
                ))
                .toList();
    }

    public void sendFriendRequest(Authentication authentication, CreateFriendRequestDto request) {
        User current = getCurrentUser(authentication);
        User target = userRepository.findById(request.targetUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found"));

        if (current.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself");
        }

        if (findAnyRelation(current.getId(), target.getId()) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already exists");
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(current);
        friendship.setAddressee(target);
        friendship.setStatus(FriendshipStatus.PENDING);
        friendshipRepository.save(friendship);
    }

    public List<FriendRequestDto> listIncomingRequests(Authentication authentication) {
        User current = getCurrentUser(authentication);

        return friendshipRepository
                .findByStatusAndAddresseeIdOrderByCreatedAtDesc(FriendshipStatus.PENDING, current.getId())
                .stream()
                .map(request -> new FriendRequestDto(
                        request.getId(),
                        toFriendUser(request.getRequester()),
                        request.getCreatedAt()
                ))
                .toList();
    }

    public void acceptRequest(Authentication authentication, Long requestId) {
        User current = getCurrentUser(authentication);
        Friendship request = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!request.getAddressee().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Request does not belong to this user");
        }
        if (request.getStatus() != FriendshipStatus.PENDING) {
            return;
        }

        request.setStatus(FriendshipStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        friendshipRepository.save(request);
    }

    public FriendInviteDto createInvite(Authentication authentication) {
        User current = getCurrentUser(authentication);
        String token = UUID.randomUUID().toString().replace("-", "");
        String inviteUrl = inviteBaseUrl + token;

        FriendInviteToken invite = new FriendInviteToken();
        invite.setToken(token);
        invite.setInviter(current);
        invite.setExpiresAt(LocalDateTime.now().plusMinutes(inviteExpirationMinutes));
        inviteTokenRepository.save(invite);

        return new FriendInviteDto(token, inviteUrl, buildQrBase64(inviteUrl), invite.getExpiresAt());
    }

    public void acceptInvite(Authentication authentication, String token) {
        User current = getCurrentUser(authentication);
        FriendInviteToken invite = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));

        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite has expired");
        }
        if (invite.getInviter().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot use your own invite");
        }

        if (findAnyRelation(invite.getInviter().getId(), current.getId()) == null) {
            Friendship friendship = new Friendship();
            friendship.setRequester(invite.getInviter());
            friendship.setAddressee(current);
            friendship.setStatus(FriendshipStatus.ACCEPTED);
            friendship.setRespondedAt(LocalDateTime.now());
            friendshipRepository.save(friendship);
        }

        invite.setUsedAt(LocalDateTime.now());
        invite.setUsedBy(current);
        inviteTokenRepository.save(invite);
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String resolveRelation(Long currentUserId, Long otherUserId) {
        Friendship relation = findAnyRelation(currentUserId, otherUserId);
        if (relation == null) return "NONE";
        if (relation.getStatus() == FriendshipStatus.ACCEPTED) return "FRIEND";
        return relation.getRequester().getId().equals(currentUserId) ? "REQUEST_SENT" : "REQUEST_RECEIVED";
    }

    private Friendship findAnyRelation(Long userA, Long userB) {
        return friendshipRepository.findByRequesterIdAndAddresseeId(userA, userB)
                .or(() -> friendshipRepository.findByRequesterIdAndAddresseeId(userB, userA))
                .orElse(null);
    }

    private FriendUserDto toFriendUser(User user) {
        return new FriendUserDto(user.getId(), user.getFullName(), user.getNickname());
    }

    /** Igual que toFriendUser pero resolviendo el estado de presencia en tiempo real. */
    private FriendUserDto toFriendUserConPresencia(User user) {
        return new FriendUserDto(
                user.getId(),
                user.getFullName(),
                user.getNickname(),
                presenceService.estaEnLinea(user.getEmail())
        );
    }

    private String buildQrBase64(String value) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 320, 320);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (WriterException | java.io.IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generating QR");
        }
    }
}
