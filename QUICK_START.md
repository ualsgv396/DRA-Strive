# 🚀 QUICK START - Sistema de Ejercicios

## Inicio Rápido (5 minutos)

### 1. Inicia la aplicación
```bash
cd c:\Users\sergy\strive
docker-compose up -d
```

### 2. Espera a que levante
- Backend: http://localhost:8080 (tarda ~30s)
- Frontend: http://localhost:5173 (tarda ~10s)
- Base de datos: localhost:3306

### 3. Accede a la app
1. Abre http://localhost:5173 en tu navegador
2. Si aún no estás autenticado, haz login
3. Ve a la sección "Ejercicios"

### 4. Sincroniza ejercicios
1. En la página de Ejercicios, haz clic en "⟳ Sincronizar"
2. Espera a que se carguen (~30-60 segundos)
3. ¡Verás ejercicios reales de la API!

### 5. Usa los ejercicios
- **Buscar**: Escribe en el campo de búsqueda
- **Filtrar**: Selecciona un tipo de ejercicio
- **Agregar**: Haz clic en "+ Agregar" en una tarjeta
- **Agregar a Rutina**: Elige una rutina del dropdown

## Endpoints Principales

```bash
# Ver ejercicios
curl http://localhost:8080/api/exercises \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sincronizar desde API externa
curl -X POST http://localhost:8080/api/exercises/sync/external \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar
curl "http://localhost:8080/api/exercises/search?q=bench" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Agregar a rutina
curl -X POST http://localhost:8080/api/routines/1/exercises \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exerciseId": 5, "sets": 3, "reps": 10}'
```

## Estructura de Carpetas

```
backend/
├── src/main/java/com/strive/backend/
│   ├── service/
│   │   ├── ExerciseService.java (Mejorado)
│   │   ├── ExerciseApiIntegrationService.java (Nuevo)
│   │   ├── ExerciseScrapingService.java (Nuevo)
│   │   └── RoutineService.java (Mejorado)
│   ├── controller/
│   │   ├── ExerciseController.java (Ampliado)
│   │   └── RoutineController.java (Ampliado)
│   └── dto/
│       ├── ExternalExerciseDto.java (Nuevo)
│       └── AddExerciseToRoutineRequest.java (Nuevo)

frontend/
└── src/
    ├── pages/
    │   └── Ejercicios.jsx (Reescrito)
    └── components/ejercicio/
        ├── ListaEjercicios.jsx (Nuevo)
        └── TarjetaEjercicio.jsx (Mejorado)
```

## Requisitos Cumplidos ✅

- ✅ Dockerfiles para ejecutar componentes
- ✅ API de terceros (ExerciseDB.io)
- ✅ Scraping de datos (Wikipedia)
- ✅ API REST consulta (GET endpoints)
- ✅ API REST modificación (POST, PUT, DELETE)
- ✅ Listados frontend (ListaEjercicios.jsx)
- ✅ Edición frontend (Agregar a rutinas)
- ✅ Docker-compose completo

## Características Principales

🔍 **Búsqueda Avanzada**
- Búsqueda por texto en tiempo real
- Filtrado por tipo de ejercicio
- 6 tipos disponibles: STRENGTH, HYPERTROPHY, POWER, ENDURANCE, MOBILITY, SPORT_SPECIFIC

📡 **Integración de APIs**
- ExerciseDB.io: 1000+ ejercicios reales
- Wikipedia: Información de entrenamiento
- Sincronización automática con mapeo de tipos

🏋️ **Gestión de Ejercicios**
- Crear ejercicios personalizados
- Editar información
- Agregar a múltiples rutinas
- Eliminar de rutinas

📱 **Interfaz de Usuario**
- Diseño moderno y responsivo
- Tarjetas con imágenes de ejercicios
- Filtros intuitivos
- Indicadores de carga

## Notas Importantes

1. **Primera vez**: Después de sincronizar, verás ~100 ejercicios reales
2. **Búsqueda**: Espera 3+ caracteres para activar
3. **Sin duplicados**: No se sincroniza 2 veces el mismo ejercicio
4. **Imagen de placeholder**: Si una imagen no carga, usa la placeholder gris

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| API no responde | Verifica conexión a internet, ExerciseDB puede estar down |
| No ves ejercicios | Sincroniza primero con el botón ⟳ |
| Error 401 | Asegúrate de estar logeado |
| Frontend no carga | Espera 15s, verifica puerto 5173 |
| Backend falla | Verifica que MySQL esté corriendo |

## Compilación del Backend

```bash
# Compilar
cd backend
mvn clean compile

# Empaquetar
mvn clean package

# Build Docker
docker build -t strive-backend .
```

## Logs Útiles

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs de la base de datos
docker-compose logs -f mysql

# Ver todo
docker-compose logs -f
```

## Próximos Pasos

1. ✅ Sistema de ejercicios completado
2. 📊 Opcionalmente: Agregar estadísticas de entrenamientos
3. 💾 Opcionalmente: Exportar rutinas a PDF
4. 🎯 Opcionalmente: Recomendaciones personalizadas

---

**¡Sistema listo para usar! 🎉**

Disfruta de tu aplicación de ejercicios con 1000+ opciones reales de ExerciseDB.
