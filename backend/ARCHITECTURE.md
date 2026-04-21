# Strive Backend - primeros pasos

## Requisitos funcionales (MVP)
- Gestionar dos tipos de usuario: `USER` y `ADMIN`.
- Mantener catalogo global de ejercicios creado por administracion.
- Crear rutinas personalizadas para un usuario a partir del catalogo.
- En cada ejercicio de rutina guardar: foto, titulo, series, repeticiones y orden.
- Listar ejercicios por tipo de entrenamiento/perfil.

## Requisitos no funcionales (MVP)
- API REST con Spring Boot 3 + JPA + MySQL.
- Validaciones de entrada en DTOs.
- Estructura por capas: `controller -> service -> repository -> domain`.
- Preparado para seguridad JWT en iteracion siguiente.

## Modelo de datos (diagrama de clases DB)
```mermaid
classDiagram
    class User {
      Long id
      String email
      String passwordHash
      String fullName
      UserRole role
      LocalDateTime createdAt
    }

    class Exercise {
      Long id
      String title
      String imageUrl
      ExerciseType type
      String description
    }

    class Routine {
      Long id
      String name
      String goal
      LocalDateTime createdAt
      Long user_id
    }

    class RoutineExercise {
      Long id
      Long routine_id
      Long exercise_id
      Integer sets
      Integer reps
      Integer sortOrder
    }

    User "1" --> "*" Routine : owns
    Routine "1" --> "*" RoutineExercise : contains
    Exercise "1" --> "*" RoutineExercise : reused in
```

## Endpoints iniciales implementados
- `GET /api/exercises?type=STRENGTH`
- `POST /api/exercises`
- `GET /api/routines?ownerId=1`
- `POST /api/routines`

## Siguiente iteracion recomendada
1. Autenticacion JWT (`/api/auth/register`, `/api/auth/login`).
2. Permisos por rol (`ADMIN` gestiona catalogo, `USER` gestiona sus rutinas).
3. DTOs de respuesta para no exponer entidades JPA.
4. Paginacion y filtros avanzados de ejercicios.
5. Historial de entrenamientos completados (tracking real de progreso).
