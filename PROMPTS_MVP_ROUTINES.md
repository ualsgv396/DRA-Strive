# 📋 Prompts Extensos para Implementar MVP de Rutinas - Strive

> Estos prompts están diseñados para usar con Claude Code o extensiones de Copilot en VS Code.
> Usa uno a la vez, copia el contenido completo y pégalo en el chat.

---

## **PROMPT 1: VALIDACIÓN DE PERMISOS (SEGURIDAD - CRÍTICA)**

```
TAREA: Implementar validación de permisos en RoutineController

CONTEXTO:
Mi aplicación Strive tiene un gap crítico de seguridad. El RoutineController permite 
a cualquier usuario autenticado editar/eliminar rutinas de otros si conocen el ID.

ANÁLISIS DEL PROBLEMA:
- El método PUT /api/routines/{id} NO verifica que request.ownerId == usuario autenticado
- DELETE /api/routines/{id} NO valida propiedad
- Riesgo: Usuario A puede DELETE rutina de Usuario B

ESTRUCTURA ACTUAL:
Backend: c:\Users\sergy\strive\backend\src\main\java\com\strive\backend\
- controller/RoutineController.java
- service/RoutineService.java
- config/SecurityConfig.java
- Entidad: domain/Routine.java (tiene userId owner)

REQUISITOS:

1. **Backend - Modificar RoutineController.java**
   a) Inyectar `Authentication` o `SecurityContext` en cada endpoint
   b) Extraer usuario autenticado: SecurityContextHolder.getContext().getAuthentication()
   c) Para cada operación (GET, PUT, DELETE, POST ejercicio, DELETE ejercicio):
      - Recuperar la rutina de BD
      - Validar: routine.getOwnerId() == usuarioActual.getId()
      - Si NO coinciden: Lanzar AccessDeniedException o retornar 403 Forbidden
   
   Cambios específicos:
   - @GetMapping("/{id}") → Validar ownership antes de retornar
   - @PutMapping("/{id}") → Validar antes de updateRoutine()
   - @DeleteMapping("/{id}") → Validar antes de delete
   - @PostMapping("/{id}/exercises") → Validar antes de addExerciseToRoutine()
   - @DeleteMapping("/{id}/exercises/{exId}") → Validar antes de removeExerciseFromRoutine()

2. **Backend - Crear AuthorizationUtil o interceptor**
   Opción A (Recomendada - más limpio):
   - Nueva clase: com.strive.backend.util.AuthorizationUtil.java
   - Método estático: checkRoutineOwnership(Long routineId, Long userId)
     * Recupera routine desde BD
     * Si null → throw NotFoundException
     * Si userId != routine.getOwnerId() → throw AccessDeniedException
   - Usar este método en cada endpoint
   
   Opción B (Alternativa):
   - Crear @RequestMapping("/api/admin/routines") para operaciones CRUD admin
   - Mantener "/api/routines" solo para consultas del propietario

3. **Backend - Extraer userId autenticado**
   Patrón a usar en cada endpoint:
   ```java
   Authentication auth = SecurityContextHolder.getContext().getAuthentication();
   UserDetails userDetails = (UserDetails) auth.getPrincipal();
   String email = userDetails.getUsername();
   User user = userRepository.findByEmail(email); // ← necesitas repo
   Long userId = user.getId();
   ```
   
   Si no tienes UserRepository inyectable, usa AuthController pattern o 
   crea una clase @Service para extraer usuario actual.

4. **Backend - Excepciones personalizadas**
   Crear: com.strive.backend.exception/
   - AccessDeniedException.java (extends RuntimeException)
   - GlobalExceptionHandler.java @RestControllerAdvice para manejar la excepción
     * Retorna: {"error": "No tienes permiso", "status": 403}

5. **Endpoints que NO necesitan validación:**
   - POST /api/routines → usuario autenticado crea su propia rutina (el ownerId viene en request)
   - GET /api/routines?ownerId=X → OK validar que X == usuario autenticado
   - POST /api/routines/flash → idem

6. **Testing Backend (bonus):**
   Crear test: RoutineControllerSecurityTest.java
   - Test 1: Usuario A intenta DELETE rutina de Usuario B → 403
   - Test 2: Usuario A GET su propia rutina → 200
   - Test 3: Usuario no autenticado GET /routines → 401

7. **Frontend - Actualizar error handling**
   En ConstructorRutina.jsx, DetalleRutina.jsx, etc:
   - Capturar 403 responses en axios calls
   - Mostrar toast: "No tienes permiso para editar esta rutina"
   - Redirigir a /panel o mostrar modal de error

ENTREGABLE:
- RoutineController.java (modificado con validaciones)
- AuthorizationUtil.java (nueva clase helper)
- AccessDeniedException.java (nueva excepción)
- GlobalExceptionHandler.java (actualizado)
- Cambios en componentes frontend para manejar 403

TESTS A PASAR:
✓ Usuario A crea rutina → puede verla/editarla/eliminarla
✓ Usuario B intenta DELETE rutina de Usuario A → 403 Forbidden
✓ Usuario no autenticado → 401 Unauthorized
✓ Admin puede editar rutinas de otros (si aplica)
```

---

## **PROMPT 2: EDICIÓN DE EJERCICIOS POST-CREACIÓN**

```
TAREA: Implementar edición de ejercicios en rutinas existentes

CONTEXTO:
Actualmente, los usuarios pueden editar SOLO nombre/objetivo de rutinas.
Si necesitan cambiar un ejercicio (sets, reps, carga), deben eliminar la rutina 
y recrearla. Esto es frustrante para UX.

NECESIDAD:
Permitir editar/agregar/quitar ejercicios de una rutina existente sin recrearla.

ESTRUCTURA ACTUAL:
Backend:
- RoutineService.java tiene: addExerciseToRoutine(), removeExerciseFromRoutine()
- RoutineExercise.java entity (sets, reps, loadValue, loadUnit, sortOrder)
- DTOs: RoutineExerciseRequest.java

Frontend:
- DetalleRutina.jsx (muestra rutina, pero botones no funcionales)
- ItemEjercicioRutina.jsx (stub - no implementado)

REQUISITOS BACKEND:

1. **Crear nuevos endpoints PUT para actualizar ejercicios**
   - PUT /api/routines/{routineId}/exercises/{routineExerciseId}
     Body: {"sets": 4, "reps": 8, "loadValue": 60, "loadUnit": "KG", "sortOrder": 2}
     Response: RoutineExercise actualizado
   
   - PATCH /api/routines/{routineId}/exercises/reorder
     Body: [{"routineExerciseId": 1, "sortOrder": 1}, {"routineExerciseId": 2, "sortOrder": 2}]
     Response: Lista reordenada

2. **Actualizar RoutineService.java**
   Métodos nuevos:
   - updateRoutineExercise(Long routineId, Long routineExerciseId, RoutineExerciseRequest request)
     * Recuperar RoutineExercise
     * Validar: routine.getId() == routineExerciseId.routine.getId() (belongs to routine)
     * Actualizar sets, reps, loadValue, loadUnit
     * Guardar y retornar
   
   - reorderExercises(Long routineId, List<Map<Long, Integer>> sortMap)
     * Para cada {routineExerciseId: X, sortOrder: Y}
     * Validar ownership
     * Actualizar sortOrder
     * Guardar todos

3. **Actualizar RoutineController.java**
   - Agregar @PutMapping("/{routineId}/exercises/{routineExerciseId}")
     * Validar ownership de routine (usuario autenticado == routine.owner)
     * Llamar updateRoutineExercise()
   
   - Agregar @PatchMapping("/{routineId}/exercises/reorder")
     * Validar ownership
     * Llamar reorderExercises()

4. **Validaciones importantes**
   - sets >= 1 && sets <= 20
   - reps >= 1 && reps <= 100 (o ajusta según lógica)
   - loadValue >= 0 (puede ser 0 para ejercicios sin carga)
   - sortOrder debe ser continuo y sin duplicados
   - Exercise debe existir y ser público o del usuario

5. **DTOs**
   Actualizar RoutineExerciseRequest.java si es necesario:
   - Asegurar que tiene: sets, reps, loadValue, loadUnit, sortOrder
   - Agregar @Valid con @Min, @Max, etc.

6. **Database**
   Si RoutineExercise no tiene updateable fields en JPA:
   - Verificar que sets, reps, loadValue, loadUnit sean @Column(updatable = true)
   - No necesita migration si la tabla ya existe

REQUISITOS FRONTEND:

1. **Componente: EditarEjercicioRutina.jsx (nuevo)**
   - Props: {routineId, routineExercise, onSave, onCancel}
   - Form con campos:
     * sets (number input, 1-20)
     * reps (number input, 1-100)
     * loadValue (number, nullable)
     * loadUnit (dropdown: KG, REPS, SECONDS, MINUTES)
   - Botones: "Guardar", "Cancelar"
   - On Save: 
     * PUT /api/routines/{routineId}/exercises/{routineExerciseId}
     * Mostrar loading spinner
     * Si 200: cerrar modal, actualizar lista
     * Si 400/403/500: mostrar error toast
   
2. **Componente: ItemEjercicioRutina.jsx (implementar)**
   Actualmente stub. Debe:
   - Props: {exercise, routineExercise, routineId, onDelete, onEdit}
   - Mostrar: imagen ejercicio, nombre, sets×reps, carga
   - Botones:
     * "✏️ Editar" → abre EditarEjercicioRutina en modal
     * "🗑️ Eliminar" → llamar onDelete() con confirmación
     * "⬆️ Mover arriba" → reorder (opcional para MVP)
     * "⬇️ Mover abajo" → reorder (opcional para MVP)
   
3. **Página: DetalleRutina.jsx (actualizar)**
   - Ya carga rutina con GET /api/routines/{id}
   - Sustituir iteración manual por <ItemEjercicioRutina> component
   - Estado local para lista de ejercicios
   - On edit: abrir modal con EditarEjercicioRutina
   - On delete: llamar DELETE /api/routines/{id}/exercises/{exId}
   - On reorder: llamar PATCH /api/routines/{id}/exercises/reorder

4. **Modal de Edición**
   - Usar componente modal existente (si existe)
   - Mostrar nombre del ejercicio + imagen
   - Form con validaciones
   - Loading state durante POST/PUT

5. **Estados de carga**
   - Mientras edita: botón deshabilitado, spinner
   - Optimistic update (opcional): actualizar UI antes de respuesta servidor

6. **Errores comunes a manejar**
   - 404 Not Found (rutina/ejercicio no existe)
   - 403 Forbidden (no es propietario)
   - 400 Bad Request (validación fallida - mostrar fields específicos)
   - 500 Internal Server Error (mostrar "Error del servidor, intenta más tarde")

ENTREGABLE:
Backend:
- RoutineService.java (nuevos métodos updateRoutineExercise, reorderExercises)
- RoutineController.java (nuevos endpoints PUT/PATCH)
- Validaciones en DTOs

Frontend:
- EditarEjercicioRutina.jsx (nuevo componente modal)
- ItemEjercicioRutina.jsx (implementado completamente)
- DetalleRutina.jsx (integración con componentes nuevos)

TESTS ESPERADOS:
✓ Usuario edita sets de un ejercicio: de 3 a 5 → se actualiza en BD y UI
✓ Usuario cambia carga de 60kg a 70kg → se guarda
✓ Usuario reordena 3 ejercicios → sortOrder 1,2,3 actualizado
✓ Usuario intenta editar ejercicio de otro → 403
✓ Usuario intenta sets=0 → validación rechaza
✓ Usuario elimina ejercicio de rutina → 200, rutina tiene 1 menos
```

---

## **PROMPT 3: HISTORIAL DE ENTRENAMIENTOS BÁSICO**

```
TAREA: Implementar sistema de historial de entrenamientos (log de sesiones completadas)

CONTEXTO:
Los usuarios necesitan registrar cuando completaron una rutina y con qué números reales 
(sets/reps/carga que levantaron). Esto permite tracking de progreso a lo largo del tiempo.

MVP SCOPE (básico):
- Logging simple: usuario marca rutina como "completada hoy"
- Registro: fecha, rutina ID, sets/reps reales (puede ser igual a planeado o diferente)
- Vista: historial de últimas 30 sesiones en tabla
- NO incluir: análisis avanzado, gráficos, sincronización wearables

ARCHITECTURE GENERAL:

1. **Entidades nuevas (Backend)**
   
   a) TrainingSession.java (JPA Entity)
      - id (Long, @Id @GeneratedValue)
      - user (User @ManyToOne)
      - routine (Routine @ManyToOne)
      - startedAt (LocalDateTime)
      - completedAt (LocalDateTime, nullable)
      - durationMinutes (Integer, nullable)
      - notes (String, nullable - "me sentía débil", "buen día")
      - status (ENUM: STARTED, COMPLETED, ABANDONED)
      - @Table("training_sessions")
   
   b) TrainingExerciseRecord.java (JPA Entity)
      - id (Long)
      - trainingSession (TrainingSession @ManyToOne)
      - routineExercise (RoutineExercise @ManyToOne)
      - setsCompleted (Integer) - sets que realmente hizo
      - repsCompleted (Integer) - reps que realmente hizo
      - loadCompleted (BigDecimal) - peso que realmente levantó
      - loadUnit (ENUM: KG, REPS, SECONDS, MINUTES)
      - notes (String, nullable - "sentí mucho quemón aquí")
      - @Table("training_exercise_records")

2. **DTOs (Backend)**
   
   - StartTrainingSessionRequest.java
     Body para POST /api/training-sessions
     {"routineId": 1, "notes": "entrenamiento de hoy"}
   
   - CompleteTrainingSessionRequest.java
     Body para PUT /api/training-sessions/{id}/complete
     {
       "durationMinutes": 45,
       "notes": "buen día, levantaba pesado",
       "exercises": [
         {
           "routineExerciseId": 1,
           "setsCompleted": 3,
           "repsCompleted": 8,
           "loadCompleted": 60.5,
           "notes": "en el último set no llegué a 8"
         },
         {...}
       ]
     }
   
   - TrainingSessionResponseDto.java
     Body para GET /api/training-sessions/{id}
     {
       "id": 1,
       "routineId": 1,
       "routineName": "Push Day",
       "startedAt": "2026-05-09T10:00:00",
       "completedAt": "2026-05-09T10:45:00",
       "durationMinutes": 45,
       "status": "COMPLETED",
       "notes": "...",
       "exercises": [...]
     }

REQUISITOS BACKEND:

1. **Database Migration**
   Crear script SQL (o Flyway/Liquibase):
   ```sql
   CREATE TABLE training_sessions (
     id BIGINT PRIMARY KEY AUTO_INCREMENT,
     user_id BIGINT NOT NULL,
     routine_id BIGINT NOT NULL,
     started_at DATETIME NOT NULL,
     completed_at DATETIME,
     duration_minutes INT,
     notes VARCHAR(500),
     status VARCHAR(50) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
   );
   
   CREATE TABLE training_exercise_records (
     id BIGINT PRIMARY KEY AUTO_INCREMENT,
     training_session_id BIGINT NOT NULL,
     routine_exercise_id BIGINT NOT NULL,
     sets_completed INT NOT NULL,
     reps_completed INT NOT NULL,
     load_completed DECIMAL(8,2),
     load_unit VARCHAR(50),
     notes VARCHAR(500),
     FOREIGN KEY (training_session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
     FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id) ON DELETE CASCADE
   );
   
   CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
   CREATE INDEX idx_training_sessions_routine_id ON training_sessions(routine_id);
   CREATE INDEX idx_training_exercise_records_session ON training_exercise_records(training_session_id);
   ```

2. **Repositories (Backend)**
   
   TrainingSessionRepository extends JpaRepository<TrainingSession, Long>
   - List<TrainingSession> findByUserIdOrderByStartedAtDesc(Long userId)
   - List<TrainingSession> findByUserIdAndStatus(Long userId, TrainingSessionStatus status)
   - List<TrainingSession> findByRoutineIdAndUserIdOrderByStartedAtDesc(Long routineId, Long userId)
   
   TrainingExerciseRecordRepository extends JpaRepository<...>
   - List<TrainingExerciseRecord> findByTrainingSession(TrainingSession session)

3. **Service: TrainingSessionService.java**
   
   @Service @Transactional
   Métodos:
   
   a) startTrainingSession(Long userId, Long routineId, String notes)
      - Recuperar routine (validar que es del usuario)
      - Crear TrainingSession(user, routine, startedAt=NOW, status=STARTED)
      - Guardar y retornar DTO
   
   b) completeTrainingSession(Long sessionId, CompleteTrainingSessionRequest request)
      - Recuperar session (validar ownership)
      - Validar que session.status == STARTED
      - Actualizar: completedAt=NOW, durationMinutes, status=COMPLETED, notes
      - Para cada ejercicio en request:
        * Crear TrainingExerciseRecord
        * Guardar en BD
      - Retornar session completa con todos los records
   
   c) abandonTrainingSession(Long sessionId)
      - Actualizar status = ABANDONED
      - completedAt = NOW
   
   d) getTrainingSessionHistory(Long userId, int limit = 30)
      - findByUserIdOrderByStartedAtDesc(userId)
      - Limitar últimos 30
      - Retornar list de DTOs con ejercicios
   
   e) getTrainingSessionsByRoutine(Long userId, Long routineId)
      - Historial de sesiones de UNA rutina específica
      - Retornar DTOs ordenados descendente

4. **Controller: TrainingSessionController.java**
   
   @RestController @RequestMapping("/api/training-sessions")
   
   Endpoints:
   
   a) POST /api/training-sessions
      Body: StartTrainingSessionRequest
      Response: TrainingSessionResponseDto
      Autenticación: @PreAuthorize("hasRole('USER')")
      Lógica: 
      - Extraer userId autenticado
      - Validar que routine existe y es del usuario
      - Llamar service.startTrainingSession()
   
   b) PUT /api/training-sessions/{id}/complete
      Body: CompleteTrainingSessionRequest
      Response: TrainingSessionResponseDto
      Lógica:
      - Validar ownership de sesión
      - Validar duración > 0
      - Validar setsCompleted >= 0, repsCompleted >= 0
      - Llamar service.completeTrainingSession()
   
   c) DELETE /api/training-sessions/{id}
      (Soft delete o abandon si está STARTED)
      Lógica:
      - Validar ownership
      - Si STARTED → abandonar, si COMPLETED/ABANDONED → error o permitir?
      (Definir según negocio)
   
   d) GET /api/training-sessions?limit=30
      Response: List<TrainingSessionResponseDto>
      Lógica:
      - Extraer userId autenticado
      - Llamar service.getTrainingSessionHistory(userId, limit)
   
   e) GET /api/training-sessions/routine/{routineId}?limit=10
      Response: List<TrainingSessionResponseDto>
      Lógica:
      - Validar que routine es del usuario
      - Llamar service.getTrainingSessionsByRoutine(userId, routineId)

5. **Validaciones**
   - durationMinutes > 0 && < 600 (máx 10 horas)
   - setsCompleted >= 1
   - repsCompleted >= 1 (para sets, no para cardio)
   - loadCompleted >= 0
   - notes.length() <= 500

REQUISITOS FRONTEND:

1. **Componente: HistorialEntrenos.jsx (nuevo)**
   Ubicación: src/pages/HistorialEntrenos.jsx
   
   - Cargar en componente Did Mount: GET /api/training-sessions?limit=30
   - Mostrar tabla con columnas:
     * Fecha (MM/DD HH:MM)
     * Rutina
     * Duración (minutos)
     * Estado (Completada/Abandonada)
     * Acciones (Ver detalle, Eliminar)
   
   - Filtros (opcional MVP): por rutina, por rango fechas
   - Paginación: mostrar 20 por página, siguiente/anterior
   - Loading state mientras carga

2. **Modal: IniciarEntreno.jsx (nuevo)**
   Props: {routineId, routineName, onStart, onCancel}
   
   - Input textarea: notas opcionales
   - Botón "Iniciar entreno"
   - On click: 
     * POST /api/training-sessions
     * Abre página de seguimiento (RegistroEntreno.jsx)

3. **Página: RegistroEntreno.jsx (nuevo)**
   - Se abre después de "Iniciar entreno"
   - Props: {sessionId, routineId} (desde URL o estado)
   - GET /api/training-sessions/{sessionId}
   - Mostrar:
     * Hora inicio
     * Cronómetro (durando qué tiempo lleva)
     * Lista de ejercicios de la rutina con campos para llenar:
       - Ejercicio nombre
       - Sets planeados vs sets completados (input)
       - Reps planeadas vs reps completadas (input)
       - Carga planeada vs carga completada (input)
       - Notas por ejercicio (textarea)
   - Botones:
     * "Completar entreno" → POST /api/training-sessions/{id}/complete
     * "Abandonar" → DELETE o PUT status=ABANDONED
     * "Guardar borrador" (opcional)
   
   - After complete: modal de congratulations, opción de volver a /panel

4. **Botón en DetalleRutina.jsx**
   - Agregar botón "▶️ Iniciar entreno" (grande, destacado)
   - On click: abre IniciarEntreno modal con rutineId, routineName

5. **Ícono en Panel.jsx (Dashboard)**
   - "📊 Historial" o "📈 Mis Entrenamientos"
   - On click: navega a /historial-entrenos

6. **Rutas en App.jsx**
   ```jsx
   <Route path="/entrenamiento/:sessionId" element={<RegistroEntreno />} />
   <Route path="/historial" element={<HistorialEntrenos />} />
   ```

FLUJO DE USUARIO (End-to-End):

1. Usuario en DetalleRutina.jsx ve botón "Iniciar entreno"
2. Click → abre IniciarEntreno modal (puede agregar notas)
3. Click "Iniciar" → POST /api/training-sessions → sessionId retornado
4. Navega a /entrenamiento/{sessionId}
5. En RegistroEntreno.jsx:
   - Ve lista de ejercicios
   - Completa sets/reps/carga reales mientras entrena
   - Click "Completar entreno"
6. PUT /api/training-sessions/{sessionId}/complete → guardados todos los datos
7. Modal de éxito "¡Entreno completado! 💪"
8. Click "Ver historial" → navega a /historial-entrenos
9. Ve tabla con nuevo registro de hoy

ENTREGABLE:

Backend:
- TrainingSession.java (JPA entity)
- TrainingExerciseRecord.java (JPA entity)
- TrainingSessionRepository.java
- TrainingExerciseRecordRepository.java
- TrainingSessionService.java
- TrainingSessionController.java
- DTOs: StartTrainingSessionRequest, CompleteTrainingSessionRequest, TrainingSessionResponseDto
- Database migration SQL

Frontend:
- HistorialEntrenos.jsx
- IniciarEntreno.jsx
- RegistroEntreno.jsx
- Botones agregados a DetalleRutina.jsx y Panel.jsx
- Rutas en App.jsx

TESTS ESPERADOS:

✓ Usuario inicia sesión de entrenamiento → TrainingSession creada con status=STARTED
✓ Usuario completa sesión con 3 ejercicios → 3 TrainingExerciseRecords creados
✓ Usuario ve historial → últimas 30 sesiones en tabla
✓ Usuario filtra por rutina específica → solo esa rutina
✓ Usuario ve duración calculada
✓ Usuario abandon sesión → status=ABANDONED
✓ Otro usuario NO puede ver sesiones del usuario A
```

---

## 📋 **GUÍA DE USO**

### **Orden Recomendado de Implementación:**

1. **Primero: Prompt 1 (Seguridad)**
   - Implementar primero porque es crítica
   - Tiempo estimado: 2-3 horas
   - Impacto: Alto (evita vulnerabilidades)

2. **Segundo: Prompt 2 (Edición de Ejercicios)**
   - Mejora significativa de UX
   - Tiempo estimado: 4-5 horas
   - Impacto: Alto (usuarios no necesitan recrear rutinas)

3. **Tercero: Prompt 3 (Historial)**
   - Más complejo pero opcional en MVP
   - Tiempo estimado: 6-8 horas
   - Impacto: Medio (proporciona tracking de progreso)

### **Cómo Usar Cada Prompt:**

1. **Copia el prompt completo** (incluyendo el bloque de code)
2. **Abre VS Code con Copilot**
3. **Pega en la ventana de chat de Copilot**
4. **Espera a que Claude genere el código**
5. **Revisa los archivos propuestos**
6. **Adapta nombres de paquetes/rutas si es necesario**
7. **Copia el código a tus archivos**
8. **Prueba localmente antes de pushear**

### **Checklist de Validación**

Antes de considerar una funcionalidad "completa":

- [ ] Backend: Todos los métodos implementados
- [ ] Backend: DTOs con validaciones
- [ ] Backend: Endpoints probados con Postman/curl
- [ ] Backend: Tests unitarios passing
- [ ] Frontend: Componentes creados
- [ ] Frontend: Integración con API
- [ ] Frontend: Manejo de errores
- [ ] Frontend: Estados de carga (loading spinners)
- [ ] Todo: Build local sin errores
- [ ] Todo: Probado en docker-compose up -d

---

## 🔒 **Notas de Seguridad**

- **Prompt 1**: Crítico para producción. No saltes esta validación.
- **CORS**: Si hay problemas CORS frontend-backend, revisa `SecurityConfig.java`
- **JWT**: Asegúrate de que el token se envía en cada request (header `Authorization: Bearer ...`)
- **Rate Limiting**: Considera agregar límites de requests después de MVP

---

## 📞 **Troubleshooting Común**

| Problema | Solución |
|----------|----------|
| 401 Unauthorized | Verifica JWT token, asegúrate de estar autenticado |
| 403 Forbidden | Valida que eres propietario del recurso |
| 404 Not Found | Verifica IDs en URL, asegúrate de que recurso existe |
| CORS Error | Revisa SecurityConfig.java, agrega tu dominio frontend |
| null pointer | Verifica null checks en service/repository |
| Rutas no funciona | Asegúrate de que las rutas están en App.jsx |

---

**¡Éxito con la implementación! 🚀**
