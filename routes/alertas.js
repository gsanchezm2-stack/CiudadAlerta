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

router.get('/stats', verificarToken, verificarPermiso('alertas:ver_stats'), alertasController.stats);
router.get('/export', verificarToken, verificarPermiso('alertas:ver'), alertasController.exportar);
router.get('/', verificarToken, verificarPermiso('alertas:ver'), listarAlertas, alertasController.listar);
router.get('/:id', verificarToken, verificarPermiso('alertas:ver'), obtenerAlerta, alertasController.obtener);
router.post('/', verificarToken, verificarPermiso('alertas:crear'), upload.array('adjuntos', 3), crearAlerta, alertasController.crear);
router.patch('/:id/estado', verificarToken, verificarCambioEstado(Alerta), cambiarEstado, alertasController.cambiarEstado);
router.delete('/:id', verificarToken, verificarPermiso('alertas:eliminar'), eliminarAlerta, alertasController.eliminar);
router.patch('/:id/restaurar', verificarToken, verificarPermiso('alertas:eliminar'), restaurarAlerta, alertasController.restaurar);

router.post('/:id/comentarios', verificarToken, verificarPermiso('comentarios:crear'), crearComentario, comentariosController.crear);
router.get('/:id/comentarios', verificarToken, verificarPermiso('comentarios:ver'), listarComentarios, comentariosController.listar);

module.exports = router;
