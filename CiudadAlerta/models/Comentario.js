const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
  texto: { type: String, required: true, trim: true, maxlength: 500 },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  alerta: { type: mongoose.Schema.Types.ObjectId, ref: 'Alerta', required: true },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

comentarioSchema.index({ alerta: 1, fecha: -1 });

module.exports = mongoose.model('Comentario', comentarioSchema);
