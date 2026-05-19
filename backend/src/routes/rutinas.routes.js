// src/routes/rutinas.routes.js
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/rutinas.controller');
const ejCtrl   = require('../controllers/ejercicios.controller');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

// Todas requieren auth
router.use(auth);

// GET    /api/rutinas           → listar
// POST   /api/rutinas           → crear
// GET    /api/rutinas/:id       → detalle completo
// PATCH  /api/rutinas/:id       → actualizar
// DELETE /api/rutinas/:id       → eliminar

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('nivel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado', 'Todos']),
    body('duracion_min').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.create
);

router.patch('/:id',
  [
    body('nombre').optional().trim().notEmpty(),
    body('nivel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado', 'Todos']),
  ],
  validate,
  ctrl.update
);

router.delete('/:id', ctrl.remove);

// ── Subrutas de ejercicios por grupo ──────────────────────────────────────────
// GET    /api/rutinas/grupos/:grupoId/ejercicios
// POST   /api/rutinas/grupos/:grupoId/ejercicios
// PATCH  /api/rutinas/ejercicios/:id
// DELETE /api/rutinas/ejercicios/:id

router.get('/grupos/:grupoId/ejercicios',  ejCtrl.listByGrupo);

router.post('/grupos/:grupoId/ejercicios',
  [body('nombre').trim().notEmpty()],
  validate,
  ejCtrl.create
);

router.patch('/ejercicios/:id',  ejCtrl.update);
router.delete('/ejercicios/:id', ejCtrl.remove);

module.exports = router;
