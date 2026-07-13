const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermiso } = require('../middleware/auth');
const controller = require('../controllers/usuariosController');
const { cambiarRol } = require('../middleware/validateUsuarios');

router.get('/', verificarToken, verificarPermiso('usuarios:ver'), controller.listar);
router.patch('/:id/rol', verificarToken, verificarPermiso('usuarios:editar_rol'), cambiarRol, controller.cambiarRol);

module.exports = router;
