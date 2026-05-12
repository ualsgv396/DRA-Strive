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

@Entity
@Table(name = "routine_exercises")
public class RoutineExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "routine_id", nullable = false)
    @JsonIgnore
    private Routine routine;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(nullable = false)
    private Integer sets;

    @Column(nullable = false)
    private Integer reps;

    // Carga: kg para fuerza/movilidad, segundos/minutos para cardio
    @Column
    private Double loadValue;

    // KG | REPS | SECONDS | MINUTES
    @Column(length = 20)
    private String loadUnit;

    @Column(nullable = false)
    private Integer sortOrder;

    public Long getId() { return id; }
    public Routine getRoutine() { return routine; }
    public void setRoutine(Routine routine) { this.routine = routine; }
    public Exercise getExercise() { return exercise; }
    public void setExercise(Exercise exercise) { this.exercise = exercise; }
    public Integer getSets() { return sets; }
    public void setSets(Integer sets) { this.sets = sets; }
    public Integer getReps() { return reps; }
    public void setReps(Integer reps) { this.reps = reps; }
    public Double getLoadValue() { return loadValue; }
    public void setLoadValue(Double loadValue) { this.loadValue = loadValue; }
    public String getLoadUnit() { return loadUnit; }
    public void setLoadUnit(String loadUnit) { this.loadUnit = loadUnit; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
