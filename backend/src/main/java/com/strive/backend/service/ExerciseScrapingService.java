package com.strive.backend.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

@Service
public class ExerciseScrapingService {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    /**
     * Obtiene información de ejercicios por scraping de una fuente externa
     * En este caso usamos una estructura para mapear ejercicios y sus beneficios
     */
    public List<Map<String, String>> scrapeExerciseBenefits() {
        List<Map<String, String>> exerciseBenefits = new ArrayList<>();
        
        try {
            System.out.println("Iniciando scraping de datos de ejercicios");
            
            // Conectamos a un sitio web con información de ejercicios
            // Usando Wikipedia como ejemplo de scraping público
            Document doc = Jsoup.connect("https://en.wikipedia.org/wiki/List_of_weightlifting_exercises")
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();
            
            // Extrae las tablas con información de ejercicios
            Elements tables = doc.select("table.wikitable");
            
            if (!tables.isEmpty()) {
                Element table = tables.first();
                Elements rows = table.select("tbody tr");
                
                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() >= 2) {
                        Map<String, String> exercise = new HashMap<>();
                        exercise.put("name", cells.get(0).text());
                        exercise.put("description", cells.get(1).text());
                        exerciseBenefits.add(exercise);
                    }
                }
                
                System.out.println("Scraping completado. " + exerciseBenefits.size() + " ejercicios encontrados");
            }
        } catch (IOException e) {
            System.err.println("Error durante el scraping de ejercicios: " + e.getMessage());
        }
        
        return exerciseBenefits;
    }

    /**
     * Obtiene consejos de entrenamiento por scraping
     */
    public String scrapeTrainingTips() {
        try {
            System.out.println("Scraping training tips from external source");
            
            Document doc = Jsoup.connect("https://en.wikipedia.org/wiki/Physical_fitness")
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();
            
            // Extrae el primer párrafo de la página
            Elements paragraphs = doc.select("p");
            if (!paragraphs.isEmpty()) {
                String tips = paragraphs.first().text();
                System.out.println("Training tips scraped successfully");
                return tips;
            }
        } catch (IOException e) {
            System.err.println("Error scraping training tips: " + e.getMessage());
        }
        
        return "No tips available at the moment";
    }

    /**
     * Obtiene información de grupos musculares por scraping
     */
    public List<String> scrapeMuscleGroups() {
        List<String> muscleGroups = new ArrayList<>();
        
        try {
            System.out.println("Scraping muscle groups from external source");
            
            Document doc = Jsoup.connect("https://en.wikipedia.org/wiki/Muscle")
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();
            
            // Busca las listas en el contenido
            Elements lists = doc.select("ul li");
            
            for (int i = 0; i < Math.min(20, lists.size()); i++) {
                String muscleGroup = lists.get(i).text();
                if (!muscleGroup.isEmpty() && muscleGroup.length() < 50) {
                    muscleGroups.add(muscleGroup);
                }
            }
            
            System.out.println("Found " + muscleGroups.size() + " muscle groups by scraping");
        } catch (IOException e) {
            System.err.println("Error scraping muscle groups: " + e.getMessage());
        }
        
        return muscleGroups;
    }
}
