package com.strive.backend.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Interceptor STOMP que autentica al usuario en el frame CONNECT.
 *
 * Flujo:
 *   1. El cliente envía CONNECT con header "Authorization: Bearer <token>"
 *   2. Este interceptor extrae y valida el JWT
 *   3. Si es válido → accessor.setUser(principal) vincula userId ↔ canal STOMP
 *   4. Si no es válido → lanza excepción → Spring envía STOMP ERROR y cierra la conexión
 *
 * Los frames posteriores (SUBSCRIBE, SEND) no se inspeccionan aquí;
 * Spring propaga el principal establecido en el CONNECT.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtChannelInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Solo actuamos en el frame inicial CONNECT
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Token de autenticación requerido");
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtService.isTokenValid(token)) {
                throw new IllegalArgumentException("Token expirado o inválido");
            }

            String username = jwtService.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );

            // Vincula el principal al canal: Spring usa auth.getName() (= email)
            // para enrutar mensajes a /user/{email}/queue/...
            accessor.setUser(auth);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Token inválido: " + e.getMessage());
        }

        return message;
    }
}
