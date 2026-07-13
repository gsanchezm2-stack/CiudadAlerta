const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

const TIPOS_VALIDOS = ['Seguridad', 'Infraestructura', 'Movilidad', 'Ambiental', 'Salud', 'Educacion', 'Otro'];
const ESTADOS_VALIDOS = ['pendiente', 'en_revision', 'resuelto'];

const crearAlerta = [
  body('tipo')
    .notEmpty().withMessage('Tipo es obligatorio')
    .isIn(TIPOS_VALIDOS).withMessage(`Tipo invalido. Opciones: ${TIPOS_VALIDOS.join(', ')}`),
  body('descripcion')
    .notEmpty().withMessage('Descripcion es obligatoria')
    .isLength({ min: 10, max: 500 }).withMessage('Descripcion: minimo 10, maximo 500 caracteres'),
  body('sector')
    .notEmpty().withMessage('Sector es obligatorio')
    .isLength({ min: 1, max: 80 }).withMessage('Sector: maximo 80 caracteres')
    .trim(),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitud invalida (-90 a 90)'),
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitud invalida (-180 a 180)'),
  validate
];

const cambiarEstado = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  body('estado')
    .notEmpty().withMessage('Estado es obligatorio')
    .isIn(ESTADOS_VALIDOS).withMessage(`Estado invalido. Opciones: ${ESTADOS_VALIDOS.join(', ')}`),
  validate
];

const listarAlertas = [
  query('page').optional().isInt({ min: 1 }).withMessage('Pagina debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite: 1-100'),
  query('sector').optional().isLength({ max: 80 }).withMessage('Sector: maximo 80 caracteres'),
  query('tipo').optional().isIn(TIPOS_VALIDOS).withMessage('Tipo invalido'),
  query('estado').optional().isIn(ESTADOS_VALIDOS).withMessage('Estado invalido'),
  query('q').optional().isLength({ max: 200 }).withMessage('Busqueda: maximo 200 caracteres'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitud invalida'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitud invalida'),
  query('radio').optional().isFloat({ min: 0.1, max: 500 }).withMessage('Radio: 0.1-500 km'),
  query('fechaDesde').optional().isISO8601().withMessage('fechaDesde: formato invalido'),
  query('fechaHasta').optional().isISO8601().withMessage('fechaHasta: formato invalido'),
  validate
];

const obtenerAlerta = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  validate
];

const eliminarAlerta = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  validate
];

const restaurarAlerta = [
  param('id').isMongoId().withMessage('ID de alerta invalido'),
  validate
];

module.exports = {
  crearAlerta,
  cambiarEstado,
  listarAlertas,
  obtenerAlerta,
  eliminarAlerta,
  restaurarAlerta,
  TIPOS_VALIDOS,
  ESTADOS_VALIDOS
};
