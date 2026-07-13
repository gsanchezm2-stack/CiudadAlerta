const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET;

exports.registro = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const emailNormalizado = email.toLowerCase().trim();
    const usuarioExiste = await Usuario.findOne({ email: emailNormalizado });
    if (usuarioExiste) {
      return res.status(409).json({ mensaje: 'El email ya esta registrado' });
    }

    const passwordEncriptada = await bcrypt.hash(password, 12);

    const usuario = new Usuario({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password: passwordEncriptada
    });

    await usuario.save();

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales invalidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario) {
      return res.json({ mensaje: 'Si el email existe, recibiras un enlace de recuperacion' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    usuario.resetToken = resetToken;
    usuario.resetTokenExpiry = resetTokenExpiry;
    await usuario.save();

    res.json({
      mensaje: 'Si el email existe, recibiras un enlace de recuperacion'
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ mensaje: 'Token invalido o expirado' });
    }

    usuario.password = await bcrypt.hash(password, 12);
    usuario.resetToken = undefined;
    usuario.resetTokenExpiry = undefined;
    await usuario.save();

    res.json({ mensaje: 'Contrasena actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('nombre email rol').lean();
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};
