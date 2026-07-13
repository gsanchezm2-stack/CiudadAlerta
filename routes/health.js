const express = require('express');
const router = express.Router();
const controller = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verificar estado del servidor
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 */
router.get('/', controller.health);

module.exports = router;
