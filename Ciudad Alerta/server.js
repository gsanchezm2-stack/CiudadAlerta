require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const createErrorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const alertasRoutes = require('./routes/alertas');
const comentariosRoutes = require('./routes/comentarios');
const usuariosRoutes = require('./routes/usuarios');
const healthRoutes = require('./routes/health');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  log.fatal('JWT_SECRET no esta definido en .env');
  process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  log.fatal('MONGODB_URI no esta definido en .env');
  process.exit(1);
}

const app = express();

app.use(pinoHttp({ logger: log }));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

function isPrivateIP(origin) {
  try {
    const url = new URL(origin);
    const h = url.hostname;
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h.startsWith('192.168.') ||
      h.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (isPrivateIP(origin)) return true;
  if (extraOrigins.includes(origin)) return true;

  try {
    const h = new URL(origin).hostname;
    if (h.endsWith('.ngrok-free.app') || h.endsWith('.ngrok-free.dev') || h.endsWith('.ngrok.io') || h.endsWith('.ngrok-free.io')) {
      return true;
    }
  } catch {}

  return false;
}

const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

const tunnelOrigins = process.env.ALLOWED_TUNNEL_ORIGINS
  ? process.env.ALLOWED_TUNNEL_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin) || tunnelOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('No permitido por CORS'));
  },
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
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { error: 'Demasiados intentos de reset' }
}));

const ROLE_LIMITS = {
  ciudadano: { windowMs: 60 * 60 * 1000, max: 100 },
  autoridad: { windowMs: 60 * 60 * 1000, max: 100 },
  administrador: { windowMs: 60 * 60 * 1000, max: 100 }
};

const alertaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    const role = req.usuario?.rol || 'ciudadano';
    return ROLE_LIMITS[role]?.max || 10;
  },
  keyGenerator: (req) => req.usuario?.id || req.socket?.remoteAddress || 'unknown',
  validate: false,
  message: { error: 'Has alcanzado el limite de alertas para tu rol' }
});
app.use('/api/alertas', alertaLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CiudadAlerta API',
      version: '1.0.0',
      description: 'API de plataforma de alertas ciudadanas'
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: [path.join(__dirname, 'routes', '*.js')]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/health', healthRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.status(200).json({
    mensaje: 'CiudadAlerta API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/api/health'
  });
});

app.use(createErrorHandler(log));

async function iniciarServidor() {
  try {
    await mongoose.connect(MONGO_URI);
    log.info('Conectado a MongoDB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      log.info(`Servidor corriendo en http://0.0.0.0:${PORT}`);
      log.info(`Documentacion API en http://0.0.0.0:${PORT}/api/docs`);
    });
  } catch (err) {
    log.error({ err: err.message }, 'Error al iniciar servidor');
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  log.warn('MongoDB desconectado. Intentando reconectar en 5s...');
  setTimeout(() => {
    mongoose.connect(MONGO_URI).catch(err => {
      log.error({ err: err.message }, 'Error al reconectar MongoDB');
    });
  }, 5000);
});

mongoose.connection.on('error', (err) => {
  log.error({ err: err.message }, 'Error de conexion MongoDB');
});

process.on('SIGTERM', async () => {
  log.info('SIGTERM recibido. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('SIGINT recibido. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

iniciarServidor();
