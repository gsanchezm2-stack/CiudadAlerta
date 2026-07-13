const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const comentariosController = require('../controllers/comentariosController');
const { eliminarComentario } = require('../middleware/validateComentarios');

router.delete('/:id', verificarToken, eliminarComentario, comentariosController.eliminar);

module.exports = router;
