const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['ciudadano', 'administrador', 'autoridad'], default: 'ciudadano' },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
