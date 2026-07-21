const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const crearComentario = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  body('texto')
    .notEmpty().withMessage('El texto del comentario es obligatorio')
    .isLength({ min: 1, max: 500 }).withMessage('Comentario: minimo 1, maximo 500 caracteres')
    .trim(),
  validate
];

const listarComentarios = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  validate
];

const eliminarComentario = [
  param('id').isMongoId().withMessage('ID de comentario invalido'),
  validate
];

module.exports = { crearComentario, listarComentarios, eliminarComentario };
