package com.strive.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

/**
 * Representa el canal de chat entre exactamente dos usuarios.
 *
 * Invariante clave (aplicada en ChatService):
 *   userA.id < userB.id
 *
 * Esto, junto con la restricción UNIQUE(user_a_id, user_b_id), garantiza
 * que existe exactamente una fila por par de usuarios sin importar quién
 * inicia la conversación.
 */
@Entity
@Table(
    name = "conversations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_conversation_users",
        columnNames = { "user_a_id", "user_b_id" }
    )
)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario con el id menor del par (invariante: userA.id < userB.id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_a_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "suspended", "suspendedReason",
                           "suspendedAt", "lastLoginAt", "role"})
    private User userA;

    // Usuario con el id mayor del par
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_b_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "suspended", "suspendedReason",
                           "suspendedAt", "lastLoginAt", "role"})
    private User userB;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Se actualiza cada vez que se envía un mensaje (para ordenar conversaciones)
    @Column
    private LocalDateTime lastMessageAt;

    // ── Getters / Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public User getUserA() { return userA; }
    public void setUserA(User userA) { this.userA = userA; }

    public User getUserB() { return userB; }
    public void setUserB(User userB) { this.userB = userB; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
}
