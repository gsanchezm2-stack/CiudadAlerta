const mongoose = require('mongoose');

const ROLES_VALIDOS = ['ciudadano', 'administrador', 'autoridad'];

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ROLES_VALIDOS, default: 'ciudadano' },
  fecha: { type: Date, default: Date.now },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
module.exports.ROLES_VALIDOS = ROLES_VALIDOS;
