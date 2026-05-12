package com.strive.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routines")
@JsonIgnoreProperties({"owner"})
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String goal;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long ownerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "routine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoutineExercise> routineExercises = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_flash", nullable = false)
    private boolean isFlash = false;

    @Column(name = "flash_expires_at")
    private LocalDateTime flashExpiresAt;

    @Column(name = "flash_visible", nullable = false)
    private boolean flashVisible = true;

    public Long getId() { return id; }
    public Long getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public List<RoutineExercise> getRoutineExercises() { return routineExercises; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isFlash() { return isFlash; }
    public void setFlash(boolean flash) { isFlash = flash; }
    public LocalDateTime getFlashExpiresAt() { return flashExpiresAt; }
    public void setFlashExpiresAt(LocalDateTime flashExpiresAt) { this.flashExpiresAt = flashExpiresAt; }
    public boolean isFlashVisible() { return flashVisible; }
    public void setFlashVisible(boolean flashVisible) { this.flashVisible = flashVisible; }
}
