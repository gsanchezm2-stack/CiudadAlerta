const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermiso } = require('../middleware/auth');
const controller = require('../controllers/usuariosController');
const { cambiarRol } = require('../middleware/validateUsuarios');

/**
 * @swagger
 * /usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (usuarios:ver)
 */
router.get('/', verificarToken, verificarPermiso('usuarios:ver'), controller.listar);

/**
 * @swagger
 * /usuarios/{id}/rol:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Cambiar el rol de un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [ciudadano, autoridad, administrador]
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       400:
 *         description: Rol inválido
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:id/rol', verificarToken, verificarPermiso('usuarios:editar_rol'), cambiarRol, controller.cambiarRol);

module.exports = router;
