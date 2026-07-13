const mongoose = require('mongoose');

const TIPOS_ALERTA = ['Seguridad', 'Infraestructura', 'Movilidad', 'Ambiental', 'Salud', 'Educacion', 'Otro'];
const ESTADOS_ALERTA = ['pendiente', 'en_revision', 'resuelto'];

const alertaSchema = new mongoose.Schema({
  tipo: {
    type: String, required: true, enum: TIPOS_ALERTA,
    set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
  },
  descripcion: { type: String, required: true, trim: true, maxlength: 500, minlength: 10 },
  sector: { type: String, required: true, trim: true, maxlength: 80 },
  estado: { type: String, enum: ESTADOS_ALERTA, default: 'pendiente' },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha: { type: Date, default: Date.now, index: true },
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 },
  adjuntos: [{ url: String, nombre: String }],
  eliminado: { type: Boolean, default: false, index: true }
});

alertaSchema.index({ fecha: -1 });
alertaSchema.index({ sector: 1, fecha: -1 });
alertaSchema.index({ tipo: 1, fecha: -1 });
alertaSchema.index({ estado: 1, fecha: -1 });

module.exports = mongoose.model('Alerta', alertaSchema);
module.exports.TIPOS_ALERTA = TIPOS_ALERTA;
module.exports.ESTADOS_ALERTA = ESTADOS_ALERTA;
