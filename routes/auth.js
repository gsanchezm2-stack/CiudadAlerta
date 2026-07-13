const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const { registrarUsuario, loginUsuario, forgotPassword, resetPassword } = require('../middleware/validateUsuarios');

/**
 * @swagger
 * /auth/registro:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Juan Perez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "miPassword123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Email ya registrado
 */
router.post('/registro', registrarUsuario, controller.registro);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@email.com"
 *               password:
 *                 type: string
 *                 example: "miPassword123"
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', loginUsuario, controller.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar recuperación de contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@email.com"
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 *       400:
 *         description: Email no registrado
 */
router.post('/forgot-password', forgotPassword, controller.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contraseña con token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recibido por email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "nuevaPassword123"
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', resetPassword, controller.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener datos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/me', verificarToken, controller.me);

module.exports = router;
