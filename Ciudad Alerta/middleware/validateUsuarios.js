const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const ROLES_VALIDOS = ['ciudadano', 'autoridad', 'administrador'];

const registrarUsuario = [
  body('nombre')
    .notEmpty().withMessage('Nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre: 2-100 caracteres')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email es obligatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password es obligatorio')
    .isLength({ min: 8 }).withMessage('Password: minimo 8 caracteres'),
  validate
];

const loginUsuario = [
  body('email')
    .notEmpty().withMessage('Email es obligatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password es obligatorio'),
  validate
];

const forgotPassword = [
  body('email')
    .notEmpty().withMessage('Email es obligatorio')
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),
  validate
];

const resetPassword = [
  body('token')
    .notEmpty().withMessage('Token es obligatorio'),
  body('password')
    .notEmpty().withMessage('Password es obligatorio')
    .isLength({ min: 8 }).withMessage('Password: minimo 8 caracteres'),
  validate
];

const cambiarRol = [
  param('id').isMongoId().withMessage('ID de usuario invalido'),
  body('rol')
    .notEmpty().withMessage('Rol es obligatorio')
    .isIn(ROLES_VALIDOS).withMessage(`Rol invalido. Opciones: ${ROLES_VALIDOS.join(', ')}`),
  validate
];

module.exports = { registrarUsuario, loginUsuario, forgotPassword, resetPassword, cambiarRol };
