package com.strive.backend.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Registro de presencia en memoria.
 *
 * Lleva la cuenta de cuántas sesiones WebSocket activas tiene cada usuario
 * (identificado por su email = nombre del Principal STOMP). El conteo permite
 * soportar varias pestañas/dispositivos: un usuario solo pasa a "offline"
 * cuando se cierra su última sesión.
 *
 * Es un estado volátil del proceso: si el backend se reinicia, todos los
 * usuarios quedan offline hasta que sus clientes reconecten (lo hacen solos).
 */
@Service
public class PresenceService {

    /** email -> número de sesiones WebSocket abiertas. */
    private final ConcurrentHashMap<String, Integer> sesionesPorEmail = new ConcurrentHashMap<>();

    /** Registra una nueva conexión para el email dado. */
    public void usuarioConectado(String email) {
        if (email == null) return;
        sesionesPorEmail.merge(email, 1, Integer::sum);
    }

    /** Registra una desconexión; elimina la entrada al llegar a cero. */
    public void usuarioDesconectado(String email) {
        if (email == null) return;
        sesionesPorEmail.computeIfPresent(email, (clave, cuenta) -> cuenta <= 1 ? null : cuenta - 1);
    }

    /** True si el usuario tiene al menos una sesión WebSocket activa. */
    public boolean estaEnLinea(String email) {
        return email != null && sesionesPorEmail.containsKey(email);
    }

    /** Conjunto inmutable de emails actualmente en línea (por si se necesita). */
    public Set<String> emailsEnLinea() {
        return Set.copyOf(sesionesPorEmail.keySet());
    }
}
