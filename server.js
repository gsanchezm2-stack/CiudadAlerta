require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// ===== CONFIGURACIÓN CORS =====
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ===== CONEXIÓN A MONGODB =====
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ciudadalerta')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ===== ESQUEMA Y MODELO =====
const alertaSchema = new mongoose.Schema({
  tipo: String,
  descripcion: String,
  sector: String,
  fecha: { type: Date, default: Date.now }
});

const Alerta = mongoose.model('Alerta', alertaSchema);

// ===== RUTAS =====
// Obtener todas las alertas
app.get('/alertas', async (req, res) => {
  try {
    const alertas = await Alerta.find().sort({ fecha: -1 });
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una alerta
app.post('/alertas', async (req, res) => {
  try {
    const { tipo, descripcion, sector } = req.body;
    const nuevaAlerta = new Alerta({ tipo, descripcion, sector });
    await nuevaAlerta.save();
    res.status(201).json(nuevaAlerta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar una alerta
app.delete('/alertas/:id', async (req, res) => {
  try {
    await Alerta.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alerta eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});