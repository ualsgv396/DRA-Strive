package com.strive.backend.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.strive.backend.dto.ExternalExerciseDto;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class ExerciseApiIntegrationService {

    private static final String WGER_BASE   = "https://wger.de/api/v2";
    private static final String WGER_IMAGES = "https://wger.de";
    private static final int    PAGE_SIZE   = 20; 

    private final RestTemplate restTemplate;

    public ExerciseApiIntegrationService() {
        this.restTemplate = new RestTemplate();
    }

    public List<ExternalExerciseDto> fetchExercises(int limit) {
        List<ExternalExerciseDto> result = new ArrayList<>();
        int offset = 0;

        while (result.size() < limit) {
            String url = WGER_BASE + "/exerciseinfo/?format=json&limit=" + PAGE_SIZE + "&offset=" + offset;
            try {
                String response = restTemplate.getForObject(url, String.class);
                if (response == null) break;

                JsonObject root = JsonParser.parseString(response).getAsJsonObject();
                JsonArray exercises = root.getAsJsonArray("results");
                
                if (exercises == null || exercises.isEmpty()) break;

                for (JsonElement elem : exercises) {
                    if (result.size() >= limit) break;
                    ExternalExerciseDto dto = parseExercise(elem.getAsJsonObject());
                    if (dto != null) {
                        result.add(dto);
                    }
                }

                JsonElement next = root.get("next");
                if (next == null || next.isJsonNull()) break;
                offset += PAGE_SIZE;

            } catch (RestClientException | IllegalStateException e) {
                System.err.println("Error fetching from wger.de: " + e.getMessage());
                break;
            }
        }
        return result;
    }

    private ExternalExerciseDto parseExercise(JsonObject ex) {
        try {
            String name = null;

            if (ex.has("name") && !ex.get("name").isJsonNull()) {
                name = ex.get("name").getAsString().trim();
            }

            if ((name == null || name.isEmpty()) && ex.has("translations")) {
                JsonArray translations = ex.getAsJsonArray("translations");
                if (translations != null && !translations.isEmpty()) {
                    name = translations.get(0).getAsJsonObject().get("name").getAsString().trim();
                }
            }

            if (name == null || name.isBlank()) return null;

            // --- APLICACIÓN DE TRADUCCIÓN ---
            String bodyPartRaw = "General";
            if (ex.has("category") && !ex.get("category").isJsonNull()) {
                bodyPartRaw = ex.getAsJsonObject("category").get("name").getAsString();
            }

            String targetRaw = "";
            if (ex.has("muscles") && !ex.get("muscles").isJsonNull()) {
                JsonArray muscles = ex.getAsJsonArray("muscles");
                if (!muscles.isEmpty()) {
                    JsonObject m = muscles.get(0).getAsJsonObject();
                    targetRaw = m.has("name") ? m.get("name").getAsString() : "";
                }
            }

            ExternalExerciseDto dto = new ExternalExerciseDto();
            dto.setId(String.valueOf(ex.get("id").getAsInt()));
            
            // Traducimos nombre, grupo muscular y objetivo
            dto.setName(traducirTexto(name));
            dto.setBodyPart(traducirTerminoTecnico(bodyPartRaw));
            dto.setTarget(traducirTerminoTecnico(targetRaw));
            
            // Imagen e info extra
            String imageUrl = "";
            if (ex.has("images") && !ex.get("images").isJsonNull()) {
                JsonArray images = ex.getAsJsonArray("images");
                if (!images.isEmpty()) {
                    imageUrl = WGER_IMAGES + images.get(0).getAsJsonObject().get("image").getAsString();
                }
            }
            dto.setGifUrl(imageUrl);
            dto.setEquipment("Varios");
            
            return dto;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Mapeo manual de términos para normalizar a español
     */
    private String traducirTerminoTecnico(String term) {
        if (term == null || term.isBlank()) return "General";
        String t = term.toLowerCase();
        
        if (t.contains("chest") || t.contains("petto") || t.contains("brust")) return "Pecho";
        if (t.contains("back") || t.contains("schiena") || t.contains("rücken")) return "Espalda";
        if (t.contains("arms") || t.contains("braccia") || t.contains("arme")) return "Brazos";
        if (t.contains("legs") || t.contains("gambe") || t.contains("beine")) return "Piernas";
        if (t.contains("shoulders") || t.contains("spalle") || t.contains("schultern")) return "Hombros";
        if (t.contains("abs") || t.contains("addominali") || t.contains("bauch")) return "Abdominales";
        if (t.contains("glutes") || t.contains("glutei") || t.contains("gesäß")) return "Glúteos";
        if (t.contains("biceps") || t.contains("bicicipite")) return "Bíceps";
        if (t.contains("triceps") || t.contains("tricicipite")) return "Tríceps";
        if (t.contains("calves") || t.contains("polpacci") || t.contains("waden")) return "Gemelos";
        
        return term; // Si no hay coincidencia, devuelve el original
    }

    private String traducirTexto(String texto) {
        return texto.replace("Curls", "Flexiones")
                    .replace("Squat", "Sentadilla")
                    .replace("Bench Press", "Press de Banca")
                    .replace("Dumbbell", "Mancuerna")
                    .replace("Barbell", "Barra")
                    .replace("Push-ups", "Flexiones de brazos");
    }

    // Los demás métodos (getExercisesByBodyPart, etc) se mantienen...
    public List<ExternalExerciseDto> getExercisesByBodyPart(String bodyPart) {
        Integer categoryId = resolveCategoryId(bodyPart);
        if (categoryId == null) return Collections.emptyList();
        List<ExternalExerciseDto> result = new ArrayList<>();
        String url = WGER_BASE + "/exerciseinfo/?format=json&category=" + categoryId + "&limit=50";
        try {
            String response = restTemplate.getForObject(url, String.class);
            if (response == null) return result;
            JsonObject root = JsonParser.parseString(response).getAsJsonObject();
            for (JsonElement elem : root.getAsJsonArray("results")) {
                ExternalExerciseDto dto = parseExercise(elem.getAsJsonObject());
                if (dto != null) result.add(dto);
            }
        } catch (Exception e) { System.err.println(e.getMessage()); }
        return result;
    }

    public List<String> getAllBodyParts() {
        try {
            String url = WGER_BASE + "/exercisecategory/?format=json";
            String response = restTemplate.getForObject(url, String.class);
            if (response == null) return Collections.emptyList();
            JsonObject root = JsonParser.parseString(response).getAsJsonObject();
            List<String> names = new ArrayList<>();
            for (JsonElement elem : root.getAsJsonArray("results")) {
                names.add(elem.getAsJsonObject().get("name").getAsString());
            }
            return names;
        } catch (Exception e) { return Collections.emptyList(); }
    }

    private Integer resolveCategoryId(String bodyPart) {
        return switch (bodyPart.toLowerCase()) {
            case "arms" -> 8; case "legs" -> 9; case "abs" -> 10;
            case "chest" -> 11; case "back" -> 12; case "shoulders" -> 13;
            case "calves" -> 14; case "glutes" -> 15; default -> null;
        };
    }
}