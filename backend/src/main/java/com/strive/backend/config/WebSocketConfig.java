package com.strive.backend.config;

import com.strive.backend.security.JwtChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    public WebSocketConfig(JwtChannelInterceptor jwtChannelInterceptor) {
        this.jwtChannelInterceptor = jwtChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            // Orígenes permitidos (el mismo conjunto que SecurityConfig)
            .setAllowedOriginPatterns(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost",
                "http://frontend",
                "http://strive-frontend"
            )
            // SockJS como fallback si el navegador no soporta WebSocket nativo
            .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Mensajes cuyo destino empiece por /app se enrutan a los @MessageMapping del servidor
        registry.setApplicationDestinationPrefixes("/app");

        // Broker en memoria: /topic para broadcast, /queue para mensajes privados 1-a-1
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefijo para enrutar a un usuario concreto: /user/{userId}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // El interceptor se ejecuta antes de que cualquier mensaje entre al broker.
        // Solo en CONNECT extrae el JWT y vincula el principal; los demás frames lo heredan.
        registration.interceptors(jwtChannelInterceptor);
    }
}
