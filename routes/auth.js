const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const { registrarUsuario, loginUsuario, forgotPassword, resetPassword } = require('../middleware/validateUsuarios');

router.post('/registro', registrarUsuario, controller.registro);
router.post('/login', loginUsuario, controller.login);
router.post('/forgot-password', forgotPassword, controller.forgotPassword);
router.post('/reset-password', resetPassword, controller.resetPassword);
router.get('/me', verificarToken, controller.me);

module.exports = router;
