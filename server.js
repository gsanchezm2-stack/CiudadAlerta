require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// ===== CONFIGURACIÓN CORS =====
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://*.ngrok-free.app', 'https://*.ngrok-free.dev'];
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ===== SERVIER FRONTEND (PRODUCCIÓN) =====
app.use(express.static(path.join(__dirname, '..', 'ciudadalerta-web', 'build')));

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

// ===== RUTAS CON /api =====
// Obtener todas las alertas
app.get('/api/alertas', async (req, res) => {
  try {
    const alertas = await Alerta.find().sort({ fecha: -1 });
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una alerta
app.post('/api/alertas', async (req, res) => {
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
app.delete('/api/alertas/:id', async (req, res) => {
  try {
    await Alerta.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alerta eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== RUTA DE PRUEBA =====
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// ===== SERVIER SPA (FALLBACK) =====
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'ciudadalerta-web', 'build', 'index.html'));
});

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoint: http://0.0.0.0:${PORT}/api/alertas`);
  console.log(`🌐 Accesible desde otros dispositivos en la red`);
});