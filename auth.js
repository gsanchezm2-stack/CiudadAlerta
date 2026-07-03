const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('./usuario');

const router = express.Router();

// Registro de usuario
router.post('/registro', async (req, res) => {
try {
    const { nombre, email, password, rol } = req.body;

    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
    return res.json({ mensaje: "El email ya está registrado" });
    }

    const passwordEncriptada = await bcrypt.hash(password, 10);

    const usuario = new Usuario({
    nombre,
    email,
    password: passwordEncriptada,
    rol: rol || 'ciudadano'
    });

    await usuario.save();

    res.json({
    mensaje: "Usuario registrado exitosamente",
    usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    }
    });

} catch (error) {
    res.json({ mensaje: "Error al registrar usuario", error });
}
});

// Login
router.post('/login', async (req, res) => {
try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
    return res.json({ mensaje: "Usuario no encontrado" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
    return res.json({ mensaje: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
    { id: usuario._id, rol: usuario.rol },
    process.env.JWT_SECRET || 'ciudadalerta_secret',
    { expiresIn: '24h' }
    );

    res.json({
    mensaje: "Login exitoso",
    token,
    usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    }
    });

} catch (error) {
    res.json({ mensaje: "Error al iniciar sesión", error });
}
});

module.exports = router;