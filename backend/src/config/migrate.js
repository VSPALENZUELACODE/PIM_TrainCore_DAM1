// src/config/migrate.js
// Ejecutar con: node src/config/migrate.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log('🔄 Ejecutando migraciones...');

  // ── Crear base de datos si no existe
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  // ══════════════════════════════════════════
  // USUARIOS
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100)    NOT NULL,
      email         VARCHAR(150)    NOT NULL UNIQUE,
      password_hash VARCHAR(255)    NOT NULL,
      avatar_url    VARCHAR(500)    DEFAULT NULL,
      nivel         ENUM('Principiante','Intermedio','Avanzado') DEFAULT 'Principiante',
      peso_kg       DECIMAL(5,2)    DEFAULT NULL,
      altura_cm     INT             DEFAULT NULL,
      objetivo      VARCHAR(100)    DEFAULT NULL,
      created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // RUTINAS
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS rutinas (
      id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED    DEFAULT NULL,           -- NULL = rutina del sistema
      nombre      VARCHAR(150)    NOT NULL,
      descripcion TEXT            DEFAULT NULL,
      icono       VARCHAR(10)     DEFAULT '💪',
      color       VARCHAR(60)     DEFAULT 'rgba(255,107,64,.15)',
      nivel       ENUM('Principiante','Intermedio','Avanzado','Todos') DEFAULT 'Todos',
      duracion_min INT UNSIGNED   DEFAULT NULL,
      es_publica  TINYINT(1)      DEFAULT 0,
      created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Grupos musculares por rutina (relación N:M)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS rutina_musculos (
      rutina_id   INT UNSIGNED NOT NULL,
      musculo     VARCHAR(60)  NOT NULL,
      PRIMARY KEY (rutina_id, musculo),
      FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // GRUPOS DE EJERCICIOS (secciones dentro de una rutina)
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS grupos_ejercicios (
      id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      rutina_id   INT UNSIGNED    NOT NULL,
      nombre      VARCHAR(100)    NOT NULL,
      orden       INT UNSIGNED    DEFAULT 0,
      FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // EJERCICIOS
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ejercicios (
      id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      grupo_id    INT UNSIGNED    NOT NULL,
      nombre      VARCHAR(150)    NOT NULL,
      detalle     VARCHAR(100)    DEFAULT NULL,   -- "4×10 · 90s"
      series      INT UNSIGNED    DEFAULT NULL,
      repeticiones INT UNSIGNED  DEFAULT NULL,
      descanso_seg INT UNSIGNED  DEFAULT NULL,
      orden       INT UNSIGNED    DEFAULT 0,
      FOREIGN KEY (grupo_id) REFERENCES grupos_ejercicios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // SESIONES DE ENTRENAMIENTO
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      user_id        INT UNSIGNED    NOT NULL,
      rutina_id      INT UNSIGNED    DEFAULT NULL,
      fecha          DATE            NOT NULL,
      duracion_min   INT UNSIGNED    DEFAULT NULL,
      calorias_kcal  INT UNSIGNED    DEFAULT NULL,
      notas          TEXT            DEFAULT NULL,
      completada     TINYINT(1)      DEFAULT 0,
      created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
      FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  // Series realizadas en cada sesión
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sesion_series (
      id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      sesion_id      INT UNSIGNED    NOT NULL,
      ejercicio_id   INT UNSIGNED    NOT NULL,
      serie_num      INT UNSIGNED    NOT NULL,
      repeticiones   INT UNSIGNED    DEFAULT NULL,
      peso_kg        DECIMAL(6,2)    DEFAULT NULL,
      completada     TINYINT(1)      DEFAULT 1,
      FOREIGN KEY (sesion_id)    REFERENCES sesiones(id)   ON DELETE CASCADE,
      FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // RÉCORDS PERSONALES
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS records_personales (
      id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      user_id        INT UNSIGNED    NOT NULL,
      ejercicio_id   INT UNSIGNED    NOT NULL,
      peso_kg        DECIMAL(6,2)    NOT NULL,
      repeticiones   INT UNSIGNED    DEFAULT 1,
      fecha          DATE            NOT NULL,
      created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_ej (user_id, ejercicio_id),
      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ══════════════════════════════════════════
  // LOGROS / ACHIEVEMENTS
  // ══════════════════════════════════════════
  await conn.query(`
    CREATE TABLE IF NOT EXISTS logros (
      id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
      clave       VARCHAR(60)     NOT NULL UNIQUE,
      nombre      VARCHAR(100)    NOT NULL,
      descripcion VARCHAR(255)    DEFAULT NULL,
      icono       VARCHAR(10)     DEFAULT '🏆'
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_logros (
      user_id     INT UNSIGNED NOT NULL,
      logro_id    INT UNSIGNED NOT NULL,
      obtenido_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, logro_id),
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ── Seed de logros base
  await conn.query(`
    INSERT IGNORE INTO logros (clave, nombre, descripcion, icono) VALUES
    ('first_workout',   'Primer Entrenamiento', 'Completaste tu primer sesión',       '🔥'),
    ('streak_7',        'Racha de 7 días',      '7 días consecutivos entrenando',     '⚡'),
    ('streak_30',       'Mes de hierro',        '30 días consecutivos entrenando',    '💎'),
    ('sessions_10',     '10 Sesiones',          'Completaste 10 entrenamientos',      '💪'),
    ('sessions_50',     '50 Sesiones',          'Completaste 50 entrenamientos',      '🏅'),
    ('sessions_100',    'Centenario',           'Completaste 100 entrenamientos',     '🎖️'),
    ('pr_first',        'Primer Récord',        'Estableces tu primer récord',        '🥇'),
    ('routine_creator', 'Creador',              'Creas tu primera rutina propia',     '✏️');
  `);

  console.log('✅ Migraciones completadas');
  await conn.end();
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
