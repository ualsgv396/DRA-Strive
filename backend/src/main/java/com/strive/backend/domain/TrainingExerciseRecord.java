package com.strive.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "training_exercise_records")
public class TrainingExerciseRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "training_session_id", nullable = false)
    @JsonIgnore
    private TrainingSession trainingSession;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "routine_exercise_id", nullable = false)
    private RoutineExercise routineExercise;

    @Column(nullable = false)
    private Integer setsCompleted;

    @Column(nullable = false)
    private Integer repsCompleted;

    @Column(precision = 8, scale = 2)
    private BigDecimal loadCompleted;

    @Column(length = 50)
    private String loadUnit;

    @Column(length = 500)
    private String notes;

    public Long getId() { return id; }
    public TrainingSession getTrainingSession() { return trainingSession; }
    public void setTrainingSession(TrainingSession trainingSession) { this.trainingSession = trainingSession; }
    public RoutineExercise getRoutineExercise() { return routineExercise; }
    public void setRoutineExercise(RoutineExercise routineExercise) { this.routineExercise = routineExercise; }
    public Integer getSetsCompleted() { return setsCompleted; }
    public void setSetsCompleted(Integer setsCompleted) { this.setsCompleted = setsCompleted; }
    public Integer getRepsCompleted() { return repsCompleted; }
    public void setRepsCompleted(Integer repsCompleted) { this.repsCompleted = repsCompleted; }
    public BigDecimal getLoadCompleted() { return loadCompleted; }
    public void setLoadCompleted(BigDecimal loadCompleted) { this.loadCompleted = loadCompleted; }
    public String getLoadUnit() { return loadUnit; }
    public void setLoadUnit(String loadUnit) { this.loadUnit = loadUnit; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
