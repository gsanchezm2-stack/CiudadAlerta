const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermiso, verificarCambioEstado } = require('../middleware/auth');
const alertasController = require('../controllers/alertasController');
const comentariosController = require('../controllers/comentariosController');
const Alerta = require('../models/Alerta');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imagenes (jpg, png, gif, webp)'));
    }
  }
});

const { crearAlerta, cambiarEstado, listarAlertas, obtenerAlerta, eliminarAlerta, restaurarAlerta } = require('../middleware/validateAlertas');
const { crearComentario, listarComentarios } = require('../middleware/validateComentarios');

/**
 * @swagger
 * /alertas/stats:
 *   get:
 *     tags: [Alertas]
 *     summary: Obtener estadísticas de alertas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de alertas
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (alertas:ver_stats)
 */
router.get('/stats', verificarToken, verificarPermiso('alertas:ver_stats'), alertasController.stats);

/**
 * @swagger
 * /alertas/export:
 *   get:
 *     tags: [Alertas]
 *     summary: Exportar alertas a CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (alertas:ver)
 */
router.get('/export', verificarToken, verificarPermiso('alertas:ver'), alertasController.exportar);

/**
 * @swagger
 * /alertas:
 *   get:
 *     tags: [Alertas]
 *     summary: Listar alertas con filtros y paginación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Resultados por página
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *         description: Filtrar por sector
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Seguridad, Infraestructura, Movilidad, Ambiental, Salud, Educacion, Otro]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_revision, resuelto]
 *         description: Filtrar por estado
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Búsqueda por texto
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitud para búsqueda geoespacial
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitud para búsqueda geoespacial
 *       - in: query
 *         name: radio
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 500
 *         description: Radio en km para búsqueda geoespacial
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha inicio (ISO 8601)
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha fin (ISO 8601)
 *     responses:
 *       200:
 *         description: Lista paginada de alertas
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (alertas:ver)
 */
router.get('/', verificarToken, verificarPermiso('alertas:ver'), listarAlertas, alertasController.listar);

/**
 * @swagger
 * /alertas/{id}:
 *   get:
 *     tags: [Alertas]
 *     summary: Obtener una alerta por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la alerta (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Alerta encontrada
 *       404:
 *         description: Alerta no encontrada
 */
router.get('/:id', verificarToken, verificarPermiso('alertas:ver'), obtenerAlerta, alertasController.obtener);

/**
 * @swagger
 * /alertas:
 *   post:
 *     tags: [Alertas]
 *     summary: Crear una nueva alerta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [tipo, descripcion, sector]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [Seguridad, Infraestructura, Movilidad, Ambiental, Salud, Educacion, Otro]
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               sector:
 *                 type: string
 *                 maxLength: 80
 *               lat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               lng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               adjuntos:
 *                 type: array
 *                 maxItems: 3
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Imágenes adjuntas (jpg, png, gif, webp, máx 5MB cada una)
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (alertas:crear)
 */
router.post('/', verificarToken, verificarPermiso('alertas:crear'), upload.array('adjuntos', 3), crearAlerta, alertasController.crear);

/**
 * @swagger
 * /alertas/{id}/estado:
 *   patch:
 *     tags: [Alertas]
 *     summary: Cambiar el estado de una alerta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_revision, resuelto]
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Alerta no encontrada
 */
router.patch('/:id/estado', verificarToken, verificarCambioEstado(Alerta), cambiarEstado, alertasController.cambiarEstado);

/**
 * @swagger
 * /alertas/{id}:
 *   delete:
 *     tags: [Alertas]
 *     summary: Eliminar una alerta (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta eliminada
 *       404:
 *         description: Alerta no encontrada
 */
router.delete('/:id', verificarToken, verificarPermiso('alertas:eliminar'), eliminarAlerta, alertasController.eliminar);

/**
 * @swagger
 * /alertas/{id}/restaurar:
 *   patch:
 *     tags: [Alertas]
 *     summary: Restaurar una alerta eliminada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta restaurada
 *       404:
 *         description: Alerta no encontrada
 */
router.patch('/:id/restaurar', verificarToken, verificarPermiso('alertas:eliminar'), restaurarAlerta, alertasController.restaurar);

/**
 * @swagger
 * /alertas/{id}/comentarios:
 *   post:
 *     tags: [Comentarios]
 *     summary: Agregar un comentario a una alerta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la alerta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [texto]
 *             properties:
 *               texto:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Comentario creado
 *       400:
 *         description: Error de validación
 */
router.post('/:id/comentarios', verificarToken, verificarPermiso('comentarios:crear'), crearComentario, comentariosController.crear);

/**
 * @swagger
 * /alertas/{id}/comentarios:
 *   get:
 *     tags: [Comentarios]
 *     summary: Listar comentarios de una alerta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la alerta
 *     responses:
 *       200:
 *         description: Lista de comentarios
 */
router.get('/:id/comentarios', verificarToken, verificarPermiso('comentarios:ver'), listarComentarios, comentariosController.listar);

module.exports = router;
