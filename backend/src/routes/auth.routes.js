// src/routes/auth.routes.js
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/auth.controller');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/auth/register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('nivel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado']),
  ],
  validate,
  ctrl.register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// GET /api/auth/me  (protegida)
router.get('/me', auth, ctrl.getMe);

// PATCH /api/auth/me  (protegida)
router.patch('/me', auth,
  [
    body('nivel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado']),
    body('peso_kg').optional().isFloat({ min: 20, max: 300 }),
    body('altura_cm').optional().isInt({ min: 100, max: 250 }),
  ],
  validate,
  ctrl.updateMe
);

// POST /api/auth/change-password  (protegida)
router.post('/change-password', auth,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 6 }),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
