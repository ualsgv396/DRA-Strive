package com.strive.backend.dto;

import com.google.gson.annotations.SerializedName;

public class ExternalExerciseDto {
    @SerializedName("id")
    public String id;

    @SerializedName("name")
    public String name;

    @SerializedName("target")
    public String target;

    @SerializedName("equipment")
    public String equipment;

    @SerializedName("bodyPart")
    public String bodyPart;

    @SerializedName("gifUrl")
    public String gifUrl;

    public ExternalExerciseDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getEquipment() { return equipment; }
    public void setEquipment(String equipment) { this.equipment = equipment; }
    public String getBodyPart() { return bodyPart; }
    public void setBodyPart(String bodyPart) { this.bodyPart = bodyPart; }
    public String getGifUrl() { return gifUrl; }
    public void setGifUrl(String gifUrl) { this.gifUrl = gifUrl; }
}
