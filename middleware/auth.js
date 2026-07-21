const jwt = require('jsonwebtoken');
const { tienePermiso } = require('../permisos');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function verificarPermiso(...permisos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const tieneAlguno = permisos.some(p => tienePermiso(req.usuario.rol, p));
    if (!tieneAlguno) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

function verificarCambioEstado(AlertaModel) {
  return async (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    if (tienePermiso(req.usuario.rol, 'alertas:cambiar_estado')) {
      return next();
    }

    if (tienePermiso(req.usuario.rol, 'alertas:cerrar_propia')) {
      try {
        const alerta = await AlertaModel.findById(req.params.id).lean();
        if (!alerta) {
          return res.status(404).json({ error: 'Alerta no encontrada' });
        }

        if (alerta.autor.toString() !== req.usuario.id) {
          return res.status(403).json({ error: 'No tienes permisos para modificar esta alerta' });
        }

        const { estado } = req.body;
        if (estado !== 'resuelto') {
          return res.status(403).json({ error: 'Solo puedes marcar tu alerta como resuelta' });
        }

        return next();
      } catch (error) {
        return res.status(500).json({ error: 'Error al verificar permisos' });
      }
    }

    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  };
}

module.exports = { verificarToken, verificarPermiso, verificarCambioEstado };
