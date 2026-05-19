# TrainCore — Backend API

> Node.js · Express · MySQL / MariaDB · JWT

---

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de MySQL

# 3. Crear tablas (solo la primera vez)
npm run db:migrate

# 4. Arrancar en desarrollo
npm run dev

# 4b. Arrancar en producción
npm start
```

---

## 📁 Estructura del proyecto

```
traincore-backend/
├── src/
│   ├── index.js                    ← Entry point Express
│   ├── config/
│   │   ├── db.js                   ← Pool de conexión MySQL
│   │   └── migrate.js              ← Creación de tablas + seed
│   ├── middleware/
│   │   ├── auth.js                 ← Verificación JWT
│   │   └── validate.js             ← Recoger errores de express-validator
│   ├── controllers/
│   │   ├── auth.controller.js      ← Registro, login, perfil
│   │   ├── rutinas.controller.js   ← CRUD rutinas (con grupos)
│   │   ├── ejercicios.controller.js← CRUD ejercicios individuales
│   │   └── progreso.controller.js  ← Sesiones, stats, heatmap, records, logros
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── rutinas.routes.js
│   │   └── progreso.routes.js
│   └── utils/
│       ├── jwt.js                  ← sign / verify token
│       └── response.js             ← Helpers ok() / fail()
├── .env.example
└── package.json
```

---

## 🗄️ Esquema de base de datos

| Tabla                | Descripción                                    |
|----------------------|------------------------------------------------|
| `users`              | Usuarios registrados                           |
| `rutinas`            | Rutinas (sistema + creadas por el usuario)     |
| `rutina_musculos`    | Grupos musculares por rutina (N:M)             |
| `grupos_ejercicios`  | Secciones dentro de cada rutina                |
| `ejercicios`         | Ejercicios con series/reps/descanso            |
| `sesiones`           | Entrenamientos completados                     |
| `sesion_series`      | Series registradas por sesión                  |
| `records_personales` | PR por ejercicio y usuario                     |
| `logros`             | Catálogo de achievements                       |
| `user_logros`        | Logros desbloqueados por cada usuario          |

---

## 🔐 Autenticación

Todas las rutas excepto `/api/auth/register` y `/api/auth/login` requieren:

```
Authorization: Bearer <token>
```

---

## 📡 Endpoints

### Auth

| Método | Ruta                         | Descripción               |
|--------|------------------------------|---------------------------|
| POST   | `/api/auth/register`         | Registro                  |
| POST   | `/api/auth/login`            | Login → devuelve token    |
| GET    | `/api/auth/me`               | Perfil propio 🔒          |
| PATCH  | `/api/auth/me`               | Actualizar perfil 🔒      |
| POST   | `/api/auth/change-password`  | Cambiar contraseña 🔒     |

**POST /api/auth/register** — body:
```json
{
  "name": "Alex",
  "email": "alex@traincore.app",
  "password": "miPass123",
  "nivel": "Intermedio",
  "peso_kg": 75.5,
  "altura_cm": 178,
  "objetivo": "Ganar masa muscular"
}
```

---

### Rutinas

| Método | Ruta                                     | Descripción                        |
|--------|------------------------------------------|------------------------------------|
| GET    | `/api/rutinas`                           | Listar (sistema + propias) 🔒      |
| GET    | `/api/rutinas?nivel=Intermedio`          | Filtrar por nivel 🔒               |
| GET    | `/api/rutinas?musculo=pecho`             | Filtrar por músculo 🔒             |
| GET    | `/api/rutinas/:id`                       | Detalle completo 🔒                |
| POST   | `/api/rutinas`                           | Crear rutina 🔒                    |
| PATCH  | `/api/rutinas/:id`                       | Actualizar rutina 🔒               |
| DELETE | `/api/rutinas/:id`                       | Eliminar rutina 🔒                 |
| GET    | `/api/rutinas/grupos/:grupoId/ejercicios`| Ejercicios de un grupo 🔒          |
| POST   | `/api/rutinas/grupos/:grupoId/ejercicios`| Añadir ejercicio a grupo 🔒        |
| PATCH  | `/api/rutinas/ejercicios/:id`            | Actualizar ejercicio 🔒            |
| DELETE | `/api/rutinas/ejercicios/:id`            | Eliminar ejercicio 🔒              |

**POST /api/rutinas** — body completo:
```json
{
  "nombre": "Fuerza — Tren superior",
  "icono": "💪",
  "nivel": "Intermedio",
  "duracion_min": 45,
  "musculos": ["pecho", "hombros", "brazos"],
  "grupos": [
    {
      "nombre": "Pecho",
      "ejercicios": [
        { "nombre": "Press banca plano", "detalle": "4×10 · 90s", "series": 4, "repeticiones": 10, "descanso_seg": 90 }
      ]
    }
  ]
}
```

---

### Progreso

| Método | Ruta                          | Descripción                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/progreso/sesiones`      | Registrar sesión/entrenamiento 🔒    |
| GET    | `/api/progreso/sesiones`      | Listar sesiones 🔒                   |
| GET    | `/api/progreso/sesiones/:id`  | Detalle de sesión con series 🔒      |
| DELETE | `/api/progreso/sesiones/:id`  | Eliminar sesión 🔒                   |
| GET    | `/api/progreso/stats`         | Estadísticas (`?periodo=30d`) 🔒     |
| GET    | `/api/progreso/heatmap`       | Actividad últimas 26 semanas 🔒      |
| GET    | `/api/progreso/records`       | Récords personales 🔒                |
| GET    | `/api/progreso/logros`        | Logros (todos + desbloqueados) 🔒    |

**POST /api/progreso/sesiones** — body:
```json
{
  "rutina_id": 1,
  "fecha": "2025-06-15",
  "duracion_min": 48,
  "calorias_kcal": 320,
  "notas": "Buena sesión, subí peso en press banca",
  "completada": true,
  "series": [
    { "ejercicio_id": 3, "serie_num": 1, "repeticiones": 10, "peso_kg": 80, "completada": true },
    { "ejercicio_id": 3, "serie_num": 2, "repeticiones": 10, "peso_kg": 82.5, "completada": true }
  ]
}
```

**GET /api/progreso/stats** — respuesta:
```json
{
  "ok": true,
  "stats": {
    "total_sesiones": 24,
    "minutos_total": 1080,
    "calorias_total": 7680,
    "volumen_total": 48500,
    "racha_actual": 5,
    "sesiones_por_dia": [{ "dia": 2, "sesiones": 8 }],
    "rutina_favorita": { "nombre": "Fuerza — Tren superior", "veces": 12 }
  }
}
```

---

## 🔄 Lógica automática

- **Récords personales**: al registrar una sesión con series, se actualiza automáticamente el PR del ejercicio si el peso es mayor al anterior.
- **Logros**: se evalúan tras cada sesión completada (primera sesión, 10/50/100 sesiones, racha 7/30 días, primer récord, primera rutina creada).

---

## 🔧 Variables de entorno

| Variable        | Descripción                          | Defecto             |
|-----------------|--------------------------------------|---------------------|
| `PORT`          | Puerto del servidor                  | `3000`              |
| `DB_HOST`       | Host MySQL                           | `localhost`         |
| `DB_PORT`       | Puerto MySQL                         | `3306`              |
| `DB_USER`       | Usuario MySQL                        | `root`              |
| `DB_PASSWORD`   | Contraseña MySQL                     | —                   |
| `DB_NAME`       | Nombre de la base de datos           | `traincore`         |
| `JWT_SECRET`    | Secreto para firmar tokens           | —                   |
| `JWT_EXPIRES_IN`| Duración del token                   | `7d`                |
| `BCRYPT_ROUNDS` | Rounds para hashing de contraseñas   | `10`                |
| `CORS_ORIGIN`   | Origen permitido para CORS           | `*`                 |
