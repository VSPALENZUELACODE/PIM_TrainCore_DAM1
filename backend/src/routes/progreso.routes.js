// src/routes/progreso.routes.js
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/progreso.controller');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(auth);

// ── Sesiones ──────────────────────────────────────────────────────────────────
// POST   /api/progreso/sesiones
// GET    /api/progreso/sesiones
// GET    /api/progreso/sesiones/:id
// DELETE /api/progreso/sesiones/:id

router.post('/sesiones',
  [
    body('fecha').isISO8601().withMessage('Fecha inválida (YYYY-MM-DD)'),
    body('duracion_min').optional().isInt({ min: 1 }),
    body('calorias_kcal').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.createSesion
);

router.get('/sesiones',       ctrl.listSesiones);
router.get('/sesiones/:id',   ctrl.getSesion);
router.delete('/sesiones/:id', ctrl.deleteSesion);

// ── Estadísticas ──────────────────────────────────────────────────────────────
// GET /api/progreso/stats?periodo=30d
router.get('/stats', ctrl.getStats);

// ── Heatmap ───────────────────────────────────────────────────────────────────
// GET /api/progreso/heatmap
router.get('/heatmap', ctrl.getHeatmap);

// ── Récords personales ────────────────────────────────────────────────────────
// GET /api/progreso/records
router.get('/records', ctrl.getRecords);

// ── Logros ────────────────────────────────────────────────────────────────────
// GET /api/progreso/logros
router.get('/logros', ctrl.getLogros);

module.exports = router;
