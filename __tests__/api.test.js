const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.setTimeout(300000);

let mongoServer;
let app;
let Usuario;
let Alerta;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_123';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  Usuario = mongoose.model('Usuario', new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['ciudadano', 'autoridad', 'administrador'], default: 'ciudadano' }
  }, { timestamps: true }));

  const TIPOS = ['Seguridad', 'Infraestructura', 'Movilidad', 'Ambiental', 'Salud', 'Educacion', 'Otro'];
  const ESTADOS = ['pendiente', 'en_revision', 'resuelto'];

  Alerta = mongoose.model('Alerta', new mongoose.Schema({
    tipo: { type: String, required: true, enum: TIPOS },
    descripcion: { type: String, required: true, trim: true, maxlength: 500, minlength: 10 },
    sector: { type: String, required: true, trim: true },
    estado: { type: String, enum: ESTADOS, default: 'pendiente' },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, default: Date.now },
    lat: { type: Number },
    lng: { type: Number },
    adjuntos: [{ url: String, nombre: String }],
    eliminado: { type: Boolean, default: false }
  }));

  const { verificarToken, verificarPermiso, verificarCambioEstado } = require('../middleware/auth');
  const { PERMISOS } = require('../permisos');

  app = express();
  app.use(express.json());

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
        Alerta.find(filtro).sort({ fecha: -1 }).skip(skip).limit(limitNum).populate('autor', 'nombre').lean(),
        Alerta.countDocuments(filtro)
      ]);
      res.json({ alertas, paginacion: { pagina: pageNum, porPagina: limitNum, total, paginas: Math.ceil(total / limitNum) } });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  });

  app.post('/api/alertas', verificarToken, verificarPermiso('alertas:crear'), async (req, res) => {
    try {
      const { tipo, descripcion, sector, lat, lng } = req.body;
      if (!tipo || !descripcion || !sector) {
        return res.status(400).json({ error: 'Campos obligatorios' });
      }
      const doc = {
        tipo, descripcion: descripcion.trim(), sector: sector.trim(), autor: req.usuario.id
      };
      if (lat && lng) { doc.lat = parseFloat(lat); doc.lng = parseFloat(lng); }
      const nueva = new Alerta(doc);
      await nueva.save();
      res.status(201).json(nueva);
    } catch (error) {
      res.status(400).json({ error: 'Error al crear' });
    }
  });

  app.patch('/api/alertas/:id/estado', verificarToken, verificarCambioEstado(Alerta), async (req, res) => {
    try {
      const { estado } = req.body;
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: 'Estado invalido' });
      }
      const alerta = await Alerta.findByIdAndUpdate(req.params.id, { estado }, { new: true }).lean();
      if (!alerta) return res.status(404).json({ error: 'No encontrada' });
      res.json(alerta);
    } catch (error) {
      res.status(400).json({ error: 'Error' });
    }
  });

  app.delete('/api/alertas/:id', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
    try {
      const resultado = await Alerta.findByIdAndUpdate(req.params.id, { eliminado: true }, { new: true });
      if (!resultado) return res.status(404).json({ error: 'No encontrada' });
      res.json({ message: 'Eliminada' });
    } catch (error) {
      res.status(400).json({ error: 'Error' });
    }
  });

  app.patch('/api/alertas/:id/restaurar', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
    try {
      const resultado = await Alerta.findByIdAndUpdate(req.params.id, { eliminado: false }, { new: true });
      if (!resultado) return res.status(404).json({ error: 'No encontrada' });
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: 'Error' });
    }
  });

  app.get('/api/health', async (req, res) => {
    const checks = { status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() };
    res.json(checks);
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

function makeToken(usuario) {
  return jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('CiudadAlerta API', () => {
  let adminToken, ciudadanoToken, adminUser, ciudadanoUser;

  beforeAll(async () => {
    const hash = await bcrypt.hash('test1234', 10);
    adminUser = await Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password: hash, rol: 'administrador' });
    ciudadanoUser = await Usuario.create({ nombre: 'Ciudadano', email: 'ciudad@test.com', password: hash, rol: 'ciudadano' });
    adminToken = makeToken(adminUser);
    ciudadanoToken = makeToken(ciudadanoUser);
  });

  describe('GET /api/health', () => {
    it('returns ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/alertas', () => {
    it('creates alert as ciudadano', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ tipo: 'Seguridad', descripcion: 'Robo en la esquina principal del sector norte', sector: 'Norte' });
      expect(res.status).toBe(201);
      expect(res.body.tipo).toBe('Seguridad');
      expect(res.body.estado).toBe('pendiente');
    });

    it('rejects without token', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .send({ tipo: 'Seguridad', descripcion: 'Test description long enough', sector: 'Test' });
      expect(res.status).toBe(401);
    });

    it('rejects invalid type', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ tipo: 'Invalido', descripcion: 'Test description long enough', sector: 'Test' });
      expect(res.status).toBe(400);
    });

    it('creates alert with geolocation', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ tipo: 'Movilidad', descripcion: 'Bache grande en avenida principal', sector: 'Centro', lat: -34.6037, lng: -58.3816 });
      expect(res.status).toBe(201);
      expect(res.body.lat).toBe(-34.6037);
      expect(res.body.lng).toBe(-58.3816);
    });
  });

  describe('GET /api/alertas', () => {
    let alertaId;

    beforeAll(async () => {
      const a = await Alerta.create({ tipo: 'Seguridad', descripcion: 'Test alert for listing', sector: 'TestSector', autor: ciudadanoUser._id });
      alertaId = a._id;
    });

    it('returns paginated results', async () => {
      const res = await request(app)
        .get('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas).toBeDefined();
      expect(res.body.paginacion).toBeDefined();
      expect(res.body.paginacion.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by search query', async () => {
      const res = await request(app)
        .get('/api/alertas?q=listing')
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by sector', async () => {
      const res = await request(app)
        .get('/api/alertas?sector=TestSector')
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/alertas/:id/estado', () => {
    let alertaId;

    beforeAll(async () => {
      const a = await Alerta.create({ tipo: 'Salud', descripcion: 'Test status change alert', sector: 'Test', autor: ciudadanoUser._id });
      alertaId = a._id;
    });

    it('admin can change any status', async () => {
      const res = await request(app)
        .patch(`/api/alertas/${alertaId}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'en_revision' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('en_revision');
    });

    it('ciudadano can close own alert', async () => {
      const a = await Alerta.create({ tipo: 'Infraestructura', descripcion: 'Author close test', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .patch(`/api/alertas/${a._id}/estado`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ estado: 'resuelto' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('resuelto');
    });

    it('ciudadano cannot change to en_revision', async () => {
      const a = await Alerta.create({ tipo: 'Educacion', descripcion: 'Cannot change to review', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .patch(`/api/alertas/${a._id}/estado`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ estado: 'en_revision' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/alertas (soft delete)', () => {
    it('soft deletes an alert', async () => {
      const a = await Alerta.create({ tipo: 'Otro', descripcion: 'Soft delete test alert', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .delete(`/api/alertas/${a._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const check = await Alerta.findById(a._id);
      expect(check.eliminado).toBe(true);
    });

    it('soft deleted alerts dont appear in list', async () => {
      const a = await Alerta.create({ tipo: 'Otro', descripcion: 'Hidden from list test', sector: 'Test', autor: ciudadanoUser._id });
      await request(app).delete(`/api/alertas/${a._id}`).set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/alertas')
        .set('Authorization', `Bearer ${adminToken}`);
      const found = res.body.alertas.find(x => x._id === a._id.toString());
      expect(found).toBeUndefined();
    });

    it('restores a soft deleted alert', async () => {
      const a = await Alerta.create({ tipo: 'Otro', descripcion: 'Restore test alert here', sector: 'Test', autor: ciudadanoUser._id });
      await request(app).delete(`/api/alertas/${a._id}`).set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/api/alertas/${a._id}/restaurar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const check = await Alerta.findById(a._id);
      expect(check.eliminado).toBe(false);
    });
  });
});
