require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const pino = require('pino');
const pinoHttp = require('pino-http');
const authRoutes = require('./auth');
const { verificarToken, verificarPermiso, verificarCambioEstado } = require('./middleware/auth');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET no esta definido en .env');
  process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI no esta definido en .env');
  process.exit(1);
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imagenes (jpg, png, gif, webp)'));
    }
  }
});

const app = express();

app.use(pinoHttp({ logger: log }));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intente de nuevo mas tarde' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Demasiados intentos de autenticacion' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/registro', authLimiter);

app.use(express.static(path.join(__dirname, '..', 'ciudadalerta-web', 'build')));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);

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

const Alerta = mongoose.model('Alerta', alertaSchema);

app.get('/api/alertas/stats', verificarToken, verificarPermiso('alertas:ver_stats'), async (req, res) => {
  try {
    const filtroBase = { eliminado: { $ne: true } };
    const total = await Alerta.countDocuments(filtroBase);
    const porEstado = await Alerta.aggregate([
      { $match: filtroBase },
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ]);
    const porTipo = await Alerta.aggregate([
      { $match: filtroBase },
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);
    const recientes = await Alerta.find(filtroBase).sort({ fecha: -1 }).limit(5).populate('autor', 'nombre').lean();

    res.json({
      total,
      porEstado: Object.fromEntries(porEstado.map(e => [e._id, e.count])),
      porTipo: Object.fromEntries(porTipo.map(t => [t._id, t.count])),
      recientes
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
});

app.get('/api/alertas', verificarToken, verificarPermiso('alertas:ver'), async (req, res) => {
  try {
    const { sector, tipo, estado, q, page = 1, limit = 20 } = req.query;
    const filtro = { eliminado: { $ne: true } };
    if (sector) filtro.sector = { $regex: sector.trim(), $options: 'i' };
    if (tipo) filtro.tipo = { $regex: `^${tipo.trim()}$`, $options: 'i' };
    if (estado) filtro.estado = estado;
    if (q) filtro.descripcion = { $regex: q.trim(), $options: 'i' };

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [alertas, total] = await Promise.all([
      Alerta.find(filtro)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('autor', 'nombre')
        .lean(),
      Alerta.countDocuments(filtro)
    ]);

    res.json({
      alertas,
      paginacion: {
        pagina: pageNum,
        porPagina: limitNum,
        total,
        paginas: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

app.get('/api/alertas/:id', verificarToken, verificarPermiso('alertas:ver'), async (req, res) => {
  try {
    const alerta = await Alerta.findOne({ _id: req.params.id, eliminado: { $ne: true } }).populate('autor', 'nombre email').lean();
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json(alerta);
  } catch (error) {
    res.status(400).json({ error: 'ID de alerta invalido' });
  }
});

app.post('/api/alertas', verificarToken, verificarPermiso('alertas:crear'), upload.array('adjuntos', 3), async (req, res) => {
  try {
    const { tipo, descripcion, sector, lat, lng } = req.body;

    if (!tipo || !descripcion || !sector) {
      return res.status(400).json({ error: 'Tipo, descripcion y sector son obligatorios' });
    }

    const tipoNormalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    if (!TIPOS_ALERTA.includes(tipoNormalizado)) {
      return res.status(400).json({ error: 'Tipo de alerta invalido', tipos: TIPOS_ALERTA });
    }

    if (descripcion.trim().length < 10) {
      return res.status(400).json({ error: 'La descripcion debe tener al menos 10 caracteres' });
    }

    const adjuntos = (req.files || []).map(f => ({
      url: `/uploads/${f.filename}`,
      nombre: f.originalname
    }));

    const doc = {
      tipo: tipoNormalizado,
      descripcion: descripcion.trim().slice(0, 500),
      sector: sector.trim().slice(0, 80),
      autor: req.usuario.id,
      adjuntos
    };

    if (lat && lng) {
      doc.lat = parseFloat(lat);
      doc.lng = parseFloat(lng);
    }

    const nuevaAlerta = new Alerta(doc);
    await nuevaAlerta.save();
    const poblada = await Alerta.findById(nuevaAlerta._id).populate('autor', 'nombre').lean();
    res.status(201).json(poblada);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear alerta' });
  }
});

app.patch('/api/alertas/:id/estado', verificarToken, verificarCambioEstado(Alerta), async (req, res) => {
  try {
    const { estado } = req.body;
    if (!ESTADOS_ALERTA.includes(estado)) {
      return res.status(400).json({ error: 'Estado invalido', estados: ESTADOS_ALERTA });
    }

    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate('autor', 'nombre').lean();

    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json(alerta);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar estado' });
  }
});

app.delete('/api/alertas/:id', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
  try {
    const resultado = await Alerta.findByIdAndUpdate(
      req.params.id,
      { eliminado: true },
      { new: true }
    );
    if (!resultado) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json({ message: 'Alerta eliminada' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar alerta' });
  }
});

app.patch('/api/alertas/:id/restaurar', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
  try {
    const resultado = await Alerta.findByIdAndUpdate(
      req.params.id,
      { eliminado: false },
      { new: true }
    );
    if (!resultado) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: 'Error al restaurar alerta' });
  }
});

app.get('/api/health', async (req, res) => {
  const checks = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    mongodb: 'disconnected'
  };
  try {
    checks.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    if (checks.mongodb === 'connected') {
      await mongoose.connection.db.admin().ping();
      checks.mongodb = 'ping_ok';
    }
  } catch {
    checks.mongodb = 'error';
    checks.status = 'degraded';
  }
  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

const Usuario = require('./usuario');

app.get('/api/usuarios', verificarToken, verificarPermiso('usuarios:ver'), async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('nombre email rol fecha createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.patch('/api/usuarios/:id/rol', verificarToken, verificarPermiso('usuarios:editar_rol'), async (req, res) => {
  try {
    const { rol } = req.body;
    const ROLES_VALIDOS = ['ciudadano', 'autoridad', 'administrador'];
    if (!rol || !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ error: 'Rol invalido', roles: ROLES_VALIDOS });
    }

    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true }
    ).select('nombre email rol').lean();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar rol' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'ciudadalerta-web', 'build', 'index.html'));
});

async function iniciarServidor() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar servidor:', err);
    process.exit(1);
  }
}

iniciarServidor();
