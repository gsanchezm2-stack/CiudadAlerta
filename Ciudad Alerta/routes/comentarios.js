const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const comentariosController = require('../controllers/comentariosController');
const { eliminarComentario } = require('../middleware/validateComentarios');

/**
 * @swagger
 * /comentarios/{id}:
 *   delete:
 *     tags: [Comentarios]
 *     summary: Eliminar un comentario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     responses:
 *       200:
 *         description: Comentario eliminado
 *       404:
 *         description: Comentario no encontrado
 */
router.delete('/:id', verificarToken, eliminarComentario, comentariosController.eliminar);

module.exports = router;
