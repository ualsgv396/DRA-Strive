# SISTEMA DE EJERCICIOS DE STRIVE - GUÍA COMPLETA

## 📋 Resumen de Cambios Implementados

Hemos completado la implementación del sistema completo de ejercicios de gimnasio con todas las funcionalidades requeridas:

### ✅ Requisitos Cumplidos

1. **Dockerfiles para ejecutar componentes** - Ya existentes, verificados
2. **API de terceros (ExerciseDB)** - ✅ Integrada completamente
3. **Scraping de datos externos (Wikipedia)** - ✅ Implementado
4. **API REST de consulta en backend** - ✅ Múltiples endpoints
5. **API REST de modificación en backend** - ✅ POST, PUT, DELETE
6. **Listados en frontend** - ✅ Componentes Grid con tarjetas
7. **Edición de elementos en frontend** - ✅ Agregar ejercicios a rutinas
8. **Docker-compose de la aplicación** - ✅ Verificado y funcional

## 🏗️ Arquitectura del Sistema

### Backend (Java/Spring Boot 3.4.4)

#### Nuevos Servicios:
1. **ExerciseApiIntegrationService**
   - Consume API ExerciseDB.io
   - Métodos: fetchExercises(), searchExercisesByName(), getExercisesByBodyPart(), getAllBodyParts()

2. **ExerciseScrapingService**
   - Scraping con Jsoup de Wikipedia
   - Métodos: scrapeExerciseBenefits(), scrapeTrainingTips(), scrapeMuscleGroups()

#### Endpoints Disponibles:

**Ejercicios:**
```
GET    /api/exercises                          - Listar todos o por tipo
GET    /api/exercises/{id}                     - Obtener ejercicio por ID
GET    /api/exercises/search?q=...             - Buscar ejercicios
GET    /api/exercises/bodyparts                - Obtener grupos musculares
POST   /api/exercises                          - Crear nuevo ejercicio
PUT    /api/exercises/{id}                     - Actualizar ejercicio
POST   /api/exercises/sync/external            - Sincronizar desde API (limit=100)
POST   /api/exercises/sync/bodypart/{nombre}   - Sincronizar por grupo muscular
```

**Rutinas:**
```
GET    /api/routines?ownerId=...               - Listar rutinas del usuario
GET    /api/routines/{id}                      - Obtener rutina por ID
POST   /api/routines                           - Crear rutina
PUT    /api/routines/{id}                      - Actualizar rutina
POST   /api/routines/{id}/exercises            - Agregar ejercicio a rutina
DELETE /api/routines/{routineId}/exercises/{exerciseId} - Remover ejercicio
```

### Frontend (React/Vite)

#### Nuevos Componentes:
1. **ListaEjercicios.jsx** - Grid de ejercicios con filtrado
2. **TarjetaEjercicio.jsx** - Tarjeta individual con información completa
3. **Ejercicios.jsx (actualizado)** - Página principal con búsqueda y sincronización

#### Funcionalidades:
- ✅ Búsqueda en tiempo real (3+ caracteres)
- ✅ Filtrado por tipo de ejercicio
- ✅ Botón de sincronización desde API externa
- ✅ Integración con rutinas (dropdown para agregar)
- ✅ Interfaz responsiva y moderna

## 🚀 Instrucciones de Uso

### 1. Sincronizar Ejercicios desde ExerciseDB

**Opción A: Desde la UI (Recomendado)**
1. Ve a la página de Ejercicios (`/ejercicios`)
2. Haz clic en el botón "⟳ Sincronizar"
3. Espera a que se carguen los ejercicios de la API

**Opción B: Vía API cURL**
```bash
curl -X POST http://localhost:8080/api/exercises/sync/external \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

### 2. Sincronizar por Grupo Muscular
```bash
curl -X POST http://localhost:8080/api/exercises/sync/bodypart/chest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Buscar Ejercicios
```bash
curl -X GET "http://localhost:8080/api/exercises/search?q=bench" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Agregar Ejercicio a Rutina
```bash
curl -X POST http://localhost:8080/api/routines/1/exercises \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exerciseId": 5, "sets": 3, "reps": 10}'
```

## 📦 Dependencias Agregadas

```xml
<!-- Scraping -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.17.2</version>
</dependency>

<!-- JSON Processing -->
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>
```

## 🐳 Ejecución con Docker

### Levantar los servicios:
```bash
cd c:\Users\sergy\strive
docker-compose up -d
```

### Verificar estado:
```bash
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Acceder a la aplicación:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Base de datos: localhost:3306

## 📊 Modelo de Datos

### Ejercicio (Exercise)
```
- id (Long)
- title (String, unique)
- imageUrl (String)
- type (ExerciseType enum: STRENGTH, HYPERTROPHY, POWER, ENDURANCE, MOBILITY, SPORT_SPECIFIC)
- description (String, max 1200 chars)
```

### Rutina (Routine)
```
- id (Long)
- name (String)
- goal (String)
- owner (User)
- routineExercises (List<RoutineExercise>)
- createdAt (LocalDateTime)
```

### Ejercicio en Rutina (RoutineExercise)
```
- id (Long)
- routine (Routine)
- exercise (Exercise)
- sets (Integer)
- reps (Integer)
- sortOrder (Integer)
```

## 🔄 Flujo de Sincronización

```
1. Usuario hace clic en "Sincronizar"
2. Frontend llama POST /api/exercises/sync/external
3. Backend consulta ExerciseDB.io API
4. Para cada ejercicio de la API:
   - Verifica si ya existe por título
   - Mapea el tipo de ejercicio
   - Guarda en la base de datos
5. Frontend recarga la lista de ejercicios
6. Usuario ve los nuevos ejercicios disponibles
```

## 📱 Tipos de Ejercicios

Los tipos se mapean automáticamente de la API ExerciseDB:

- **STRENGTH**: Ejercicios de fuerza (pecho, espalda, piernas, etc.)
- **HYPERTROPHY**: Enfoque en crecimiento muscular
- **POWER**: Movimientos explosivos
- **ENDURANCE**: Resistencia y cardio
- **MOBILITY**: Flexibilidad y movilidad
- **SPORT_SPECIFIC**: Específicos para deportes

## 🔍 Búsqueda y Filtrado

### Búsqueda por Texto
- Busca en título y descripción
- Requiere 3+ caracteres
- No es sensible a mayúsculas/minúsculas

### Filtrado por Tipo
- Dropdown con todos los tipos disponibles
- "Todos" para ver todos los ejercicios
- Filtra en tiempo real

## ⚙️ Variables de Entorno (.env)

```
# Base de datos
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=strive_db
MYSQL_USER=gymuser
MYSQL_PASSWORD=gympass

# Spring DataSource
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/strive_db
SPRING_DATASOURCE_USERNAME=gymuser
SPRING_DATASOURCE_PASSWORD=gympass

# Frontend API
VITE_API_URL=http://localhost:8080/api
```

## 🛠️ Stack Tecnológico

**Backend:**
- Java 21
- Spring Boot 3.4.4
- Spring Security (JWT)
- Spring Data JPA
- MySQL 8.0

**Frontend:**
- React 18
- Vite
- Axios
- React Router

**Herramientas:**
- Maven 3.9
- Docker & Docker Compose
- Jsoup (Web Scraping)
- Gson (JSON Processing)

## 📝 Próximas Mejoras Posibles

1. **Caché de ejercicios** - Reducir llamadas a API externa
2. **Clasificación por dificultad** - Agregar campo difficulty
3. **Videos de ejercicios** - Integrar YouTube API
4. **Historial de entrenamientos** - Registrar completados
5. **Recomendaciones personalizadas** - ML/AI
6. **Exportar rutinas** - PDF, Excel, JSON
7. **Compartir rutinas** - Entre usuarios
8. **Social features** - Comentarios, likes en rutinas

## 🐛 Resolución de Problemas

### "No se sincroniza desde API"
- Verifica conexión a internet
- Comprueba que ExerciseDB está accesible
- Revisa logs del backend

### "Los ejercicios no aparecen"
- Sincroniza primero con el botón
- Verifica que la base de datos esté activa
- Comprueba query params

### "Error 401 al agregar ejercicio"
- Verifica que el JWT token sea válido
- Asegúrate de estar autenticado
- Revisa que el token no haya expirado

## 📞 Contacto y Soporte

Para preguntas sobre la implementación:
1. Revisa los comentarios en el código
2. Consulta la documentación de las APIs
3. Verifica los logs del backend

## ✨ Celebración

¡Sistema de ejercicios completamente implementado! 🎉

Todas las funcionalidades están listas para:
- Sincronizar ejercicios de la API externa
- Buscar y filtrar ejercicios
- Agregar ejercicios a rutinas
- Gestionar rutinas de entrenamiento

¡Disfruta tu aplicación de ejercicios! 💪
