const Alerta = require('../models/Alerta');
const Comentario = require('../models/Comentario');
const { tienePermiso } = require('../permisos');

exports.crear = async (req, res, next) => {
  try {
    const { texto } = req.body;

    const alerta = await Alerta.findOne({ _id: req.params.id, eliminado: { $ne: true } });
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    const comentario = new Comentario({
      texto: texto.trim().slice(0, 500),
      autor: req.usuario.id,
      alerta: req.params.id
    });

    await comentario.save();
    const poblado = await Comentario.findById(comentario._id).populate('autor', 'nombre rol').lean();
    res.status(201).json(poblado);
  } catch (error) {
    next(error);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const comentarios = await Comentario.find({ alerta: req.params.id })
      .populate('autor', 'nombre rol')
      .sort({ fecha: -1 })
      .lean();
    res.json(comentarios);
  } catch (error) {
    next(error);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    const esAutor = comentario.autor.toString() === req.usuario.id;
    const tienePermisoEliminar = tienePermiso(req.usuario.rol, 'comentarios:eliminar');

    if (!esAutor && !tienePermisoEliminar) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este comentario' });
    }

    await Comentario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (error) {
    next(error);
  }
};
