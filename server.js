const express = require('express');
const app = express();

app.use(express.json());

let alertas = [];

// Ruta principal
app.get('/', (req, res) => {
res.json({
    plataforma: "CiudadAlerta",
    descripcion: "Plataforma digital de alertas y reportes ciudadanos",
    estado: "Activo",
    version: "1.0"
});
});

// Consultar todas las alertas
app.get('/alertas', (req, res) => {
res.json(alertas);
});

// Consultar una alerta por id
app.get('/alertas/:id', (req, res) => {
const id = parseInt(req.params.id);
const alerta = alertas.find(a => a.id === id);
if (alerta) {
    res.json(alerta);
} else {
    res.json({ mensaje: "Alerta no encontrada" });
}
});

// Registrar una nueva alerta
app.post('/alertas', (req, res) => {
const alerta = {
    id: alertas.length + 1,
    tipo: req.body.tipo,
    descripcion: req.body.descripcion,
    sector: req.body.sector
};
alertas.push(alerta);
res.json({
    mensaje: "Alerta registrada exitosamente",
    alerta: alerta
});
});

// Reportar una incidencia
app.post('/incidencia', (req, res) => {
const incidencia = {
    tipo: req.body.tipo,
    descripcion: req.body.descripcion,
    ubicacion: req.body.ubicacion
};
res.json({
    mensaje: "Incidencia reportada exitosamente",
    incidencia: incidencia
});
});

app.listen(3000, () => {
console.log('CiudadAlerta ejecutándose en puerto 3000');
});