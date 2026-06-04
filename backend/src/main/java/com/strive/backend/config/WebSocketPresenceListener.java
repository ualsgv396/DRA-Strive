package com.strive.backend.config;

import com.strive.backend.domain.User;
import com.strive.backend.dto.PresenceEventDto;
import com.strive.backend.repository.FriendshipRepository;
import com.strive.backend.repository.UserRepository;
import com.strive.backend.service.PresenceService;
import java.security.Principal;
import java.util.List;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Conecta el ciclo de vida de las sesiones STOMP con el {@link PresenceService}
 * y emite eventos de presencia EN VIVO a los amigos del usuario.
 *
 * - SessionConnectedEvent  → marca online; si es su PRIMERA sesión, notifica
 *   a sus amigos (online = true).
 * - SessionDisconnectEvent → marca offline; si era su ÚLTIMA sesión, notifica
 *   a sus amigos (online = false).
 *
 * El evento se envía a /user/{emailAmigo}/queue/presence, de modo que solo los
 * amigos del usuario reciben el cambio. El frontend se suscribe a
 * /user/queue/presence y actualiza el punto verde sin recargar.
 *
 * El nombre del Principal es el email del usuario (ver JwtChannelInterceptor),
 * la misma clave que usa PresenceService.
 */
@Component
public class WebSocketPresenceListener {

    private static final String DESTINO_PRESENCIA = "/queue/presence";

    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketPresenceListener(
            PresenceService presenceService,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.presenceService = presenceService;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Principal user = event.getUser();
        if (user == null) return;

        String email = user.getName();
        boolean estabaEnLinea = presenceService.estaEnLinea(email);
        presenceService.usuarioConectado(email);

        // Solo notificamos en la PRIMERA sesión (evita repetir online en multi-pestaña)
        if (!estabaEnLinea) {
            notificarAmigos(email, true);
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        Principal user = event.getUser();
        if (user == null) return;

        String email = user.getName();
        presenceService.usuarioDesconectado(email);

        // Solo notificamos cuando se cierra la ÚLTIMA sesión
        if (!presenceService.estaEnLinea(email)) {
            notificarAmigos(email, false);
        }
    }

    /** Envía el cambio de estado del usuario a la cola privada de cada amigo. */
    private void notificarAmigos(String email, boolean online) {
        User usuario = userRepository.findByEmail(email).orElse(null);
        if (usuario == null) return;

        PresenceEventDto evento = new PresenceEventDto(usuario.getId(), usuario.getFullName(), online);
        List<String> emailsAmigos = friendshipRepository.findAcceptedFriendEmails(usuario.getId());

        for (String emailAmigo : emailsAmigos) {
            messagingTemplate.convertAndSendToUser(emailAmigo, DESTINO_PRESENCIA, evento);
        }
    }
}
