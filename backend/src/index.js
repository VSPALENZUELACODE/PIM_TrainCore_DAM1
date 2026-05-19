// src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth.routes');
const rutinasRoutes = require('./routes/rutinas.routes');
const progresoRoutes= require('./routes/progreso.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',   // Ajustar en producción
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, service: 'TrainCore API', ts: new Date() }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/rutinas',  rutinasRoutes);
app.use('/api/progreso', progresoRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }));

// ── Error handler global ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// ── Arrancar ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 TrainCore API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
