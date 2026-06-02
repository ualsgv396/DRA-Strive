package com.strive.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Mensaje dentro de una conversación.
 *
 * Tipos:
 *   TEXT    → content contiene el texto del mensaje.
 *   ROUTINE → content contiene una nota opcional; routineId apunta a la rutina
 *             compartida y routineNameSnapshot guarda su nombre en el momento
 *             del envío (por si la rutina se elimina después).
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "suspended", "suspendedReason",
                           "suspendedAt", "lastLoginAt", "role"})
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MessageType type = MessageType.TEXT;

    // Solo se rellena cuando type = ROUTINE.
    // Long simple (sin FK JPA) para que si la rutina se elimina,
    // el mensaje siga existiendo con routineId = id de la rutina borrada.
    @Column(name = "routine_id")
    private Long routineId;

    // Nombre de la rutina en el momento del envío.
    // Permite mostrar el nombre aunque la rutina sea eliminada posteriormente.
    @Column(name = "routine_name_snapshot", length = 255)
    private String routineNameSnapshot;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    // ── Getters / Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public Long getRoutineId() { return routineId; }
    public void setRoutineId(Long routineId) { this.routineId = routineId; }

    public String getRoutineNameSnapshot() { return routineNameSnapshot; }
    public void setRoutineNameSnapshot(String routineNameSnapshot) {
        this.routineNameSnapshot = routineNameSnapshot;
    }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
