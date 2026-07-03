const express = require('express');
const conectarDB = require('./db');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

conectarDB();

// Modelo de Alerta
const AlertaSchema = new mongoose.Schema({
tipo: String,
descripcion: String,
sector: String,
fecha: { type: Date, default: Date.now }
});

const Alerta = mongoose.model('Alerta', AlertaSchema);

// Modelo de Incidencia
const IncidenciaSchema = new mongoose.Schema({
tipo: String,
descripcion: String,
ubicacion: String,
fecha: { type: Date, default: Date.now }
});

const Incidencia = mongoose.model('Incidencia', IncidenciaSchema);

// Ruta principal
app.get('/', (req, res) => {
res.json({
    plataforma: "CiudadAlerta",
    descripcion: "Plataforma digital de alertas y reportes ciudadanos",
    estado: "Activo",
    version: "2.0"
});
});

// Consultar todas las alertas
app.get('/alertas', async (req, res) => {
const alertas = await Alerta.find();
res.json(alertas);
});

// Consultar alerta por id
app.get('/alertas/:id', async (req, res) => {
const alerta = await Alerta.findById(req.params.id);
if (alerta) {
    res.json(alerta);
} else {
    res.json({ mensaje: "Alerta no encontrada" });
}
});

// Registrar nueva alerta
app.post('/alertas', async (req, res) => {
const alerta = new Alerta({
    tipo: req.body.tipo,
    descripcion: req.body.descripcion,
    sector: req.body.sector
});
await alerta.save();
res.json({ mensaje: "Alerta registrada exitosamente", alerta });
});

// Eliminar alerta
app.delete('/alertas/:id', async (req, res) => {
await Alerta.findByIdAndDelete(req.params.id);
res.json({ mensaje: "Alerta eliminada exitosamente" });
});

// Reportar incidencia
app.post('/incidencia', async (req, res) => {
const incidencia = new Incidencia({
    tipo: req.body.tipo,
    descripcion: req.body.descripcion,
    ubicacion: req.body.ubicacion
});
await incidencia.save();
res.json({ mensaje: "Incidencia reportada exitosamente", incidencia });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`CiudadAlerta ejecutándose en puerto ${PORT}`);
});