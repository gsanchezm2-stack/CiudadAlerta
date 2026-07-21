const Usuario = require('../models/Usuario');

exports.listar = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find()
      .select('nombre email rol fecha createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

exports.cambiarRol = async (req, res, next) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol: req.body.rol },
      { new: true }
    ).select('nombre email rol').lean();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};
