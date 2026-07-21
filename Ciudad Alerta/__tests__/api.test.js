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
let Comentario;

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
    titulo: { type: String, required: true, trim: true, maxlength: 100, minlength: 5 },
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

  Comentario = mongoose.model('Comentario', new mongoose.Schema({
    texto: { type: String, required: true, trim: true, maxlength: 500 },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    alerta: { type: mongoose.Schema.Types.ObjectId, ref: 'Alerta', required: true },
    fecha: { type: Date, default: Date.now }
  }, { timestamps: true }));

  const { verificarToken, verificarPermiso, verificarCambioEstado } = require('../middleware/auth');

  app = express();
  app.use(express.json());

  // --- GET /api/alertas (mirror of alertasController.listar) ---
  app.get('/api/alertas', verificarToken, verificarPermiso('alertas:ver'), async (req, res) => {
    try {
      const { sector, tipo, estado, q, page = 1, limit = 20, fechaDesde, fechaHasta } = req.query;
      const filtro = { eliminado: { $ne: true } };
      if (sector) filtro.sector = { $regex: sector.trim(), $options: 'i' };
      if (tipo) filtro.tipo = { $regex: `^${tipo.trim()}$`, $options: 'i' };
      if (estado) filtro.estado = estado;
      if (q) {
        filtro.$or = [
          { titulo: { $regex: q.trim(), $options: 'i' } },
          { descripcion: { $regex: q.trim(), $options: 'i' } }
        ];
      }
      if (fechaDesde || fechaHasta) {
        filtro.fecha = {};
        if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
        if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
      }

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

  // --- POST /api/alertas (mirror of alertasController.crear) ---
  app.post('/api/alertas', verificarToken, verificarPermiso('alertas:crear'), async (req, res) => {
    try {
      const { titulo, tipo, descripcion, sector, lat, lng } = req.body;
      if (!titulo || !tipo || !descripcion || !sector) {
        return res.status(400).json({ error: 'Campos obligatorios' });
      }
      const tipoNormalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
      const tituloLimpio = titulo.trim();
      if (tituloLimpio.length > 100) {
        return res.status(400).json({ error: 'Titulo: maximo 100 caracteres' });
      }

      const doc = {
        titulo: tituloLimpio,
        tipo: tipoNormalizado,
        descripcion: descripcion.trim().slice(0, 500),
        sector: sector.trim().slice(0, 80),
        autor: req.usuario.id
      };
      if (lat && lng) { doc.lat = parseFloat(lat); doc.lng = parseFloat(lng); }
      const nueva = new Alerta(doc);
      await nueva.save();
      const poblada = await Alerta.findById(nueva._id).populate('autor', 'nombre').lean();
      res.status(201).json(poblada);
    } catch (error) {
      res.status(400).json({ error: 'Error al crear' });
    }
  });

  // --- PATCH /api/alertas/:id/estado ---
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

  // --- DELETE /api/alertas/:id ---
  app.delete('/api/alertas/:id', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
    try {
      const resultado = await Alerta.findByIdAndUpdate(req.params.id, { eliminado: true }, { new: true });
      if (!resultado) return res.status(404).json({ error: 'No encontrada' });
      res.json({ message: 'Eliminada' });
    } catch (error) {
      res.status(400).json({ error: 'Error' });
    }
  });

  // --- PATCH /api/alertas/:id/restaurar ---
  app.patch('/api/alertas/:id/restaurar', verificarToken, verificarPermiso('alertas:eliminar'), async (req, res) => {
    try {
      const resultado = await Alerta.findByIdAndUpdate(req.params.id, { eliminado: false }, { new: true });
      if (!resultado) return res.status(404).json({ error: 'No encontrada' });
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: 'Error' });
    }
  });

  // --- GET /api/health ---
  app.get('/api/health', async (req, res) => {
    const checks = { status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() };
    res.json(checks);
  });

  // --- GET /api/alertas/export (mirror of alertasController.exportar) ---
  app.get('/api/alertas/export', verificarToken, verificarPermiso('alertas:ver'), async (req, res) => {
    try {
      const alertas = await Alerta.find({ eliminado: { $ne: true } })
        .sort({ fecha: -1 })
        .populate('autor', 'nombre email')
        .lean();

      const header = 'ID,Titulo,Tipo,Descripcion,Sector,Estado,Autor,Fecha,Lat,Lng\n';
      const rows = alertas.map(a => {
        const fecha = new Date(a.fecha).toISOString();
        const titulo = `"${(a.titulo || '').replace(/"/g, '""')}"`;
        const desc = `"${(a.descripcion || '').replace(/"/g, '""')}"`;
        const autor = a.autor?.nombre || 'Anonimo';
        return `${a._id},${titulo},${a.tipo},${desc},${a.sector},${a.estado},${autor},${fecha},${a.lat || ''},${a.lng || ''}`;
      }).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=ciudadalerta_reportes.csv');
      res.send('\uFEFF' + header + rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al exportar' });
    }
  });

  // --- POST /api/alertas/:id/comentarios ---
  app.post('/api/alertas/:id/comentarios', verificarToken, verificarPermiso('comentarios:crear'), async (req, res) => {
    try {
      const { texto } = req.body;
      if (!texto || !texto.trim()) {
        return res.status(400).json({ error: 'El comentario no puede estar vacio' });
      }
      const alerta = await Alerta.findOne({ _id: req.params.id, eliminado: { $ne: true } });
      if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada' });
      const comentario = new Comentario({ texto: texto.trim().slice(0, 500), autor: req.usuario.id, alerta: req.params.id });
      await comentario.save();
      const poblado = await Comentario.findById(comentario._id).populate('autor', 'nombre rol').lean();
      res.status(201).json(poblado);
    } catch (error) {
      res.status(400).json({ error: 'Error al crear comentario' });
    }
  });

  // --- GET /api/alertas/:id/comentarios ---
  app.get('/api/alertas/:id/comentarios', verificarToken, verificarPermiso('comentarios:ver'), async (req, res) => {
    try {
      const comentarios = await Comentario.find({ alerta: req.params.id }).populate('autor', 'nombre rol').sort({ fecha: -1 }).lean();
      res.json(comentarios);
    } catch (error) {
      res.status(400).json({ error: 'Error al obtener comentarios' });
    }
  });

  // --- POST /api/auth/forgot-password ---
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email es obligatorio' });
    const crypto = require('crypto');
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario) return res.json({ mensaje: 'Si el email existe, recibiras un enlace' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    usuario.resetToken = resetToken;
    usuario.resetTokenExpiry = new Date(Date.now() + 3600000);
    await usuario.save();
    res.json({ mensaje: 'Token enviado', resetToken });
  });

  // --- GET /api/auth/me ---
  app.get('/api/auth/me', verificarToken, async (req, res) => {
    const usuario = await Usuario.findById(req.usuario.id).select('nombre email rol').lean();
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  });

  // --- PUT /api/auth/me (mirror of authController.updateMe) ---
  app.put('/api/auth/me', verificarToken, async (req, res) => {
    try {
      const { nombre, email } = req.body;
      const updates = {};

      if (nombre) {
        const trimmed = nombre.trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
          return res.status(400).json({ error: 'Nombre: minimo 2, maximo 100 caracteres' });
        }
        updates.nombre = trimmed;
      }

      if (email) {
        const normalized = email.toLowerCase().trim();
        const existing = await Usuario.findOne({ email: normalized, _id: { $ne: req.usuario.id } });
        if (existing) {
          return res.status(409).json({ error: 'El email ya esta en uso' });
        }
        updates.email = normalized;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      const usuario = await Usuario.findByIdAndUpdate(req.usuario.id, updates, { new: true, runValidators: true })
        .select('nombre email rol')
        .lean();

      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: 'Error al actualizar' });
    }
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
        .send({ titulo: 'Robo en zona norte', tipo: 'Seguridad', descripcion: 'Robo en la esquina principal del sector norte', sector: 'Norte' });
      expect(res.status).toBe(201);
      expect(res.body.tipo).toBe('Seguridad');
      expect(res.body.estado).toBe('pendiente');
      expect(res.body.titulo).toBe('Robo en zona norte');
    });

    it('rejects without token', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .send({ titulo: 'Test', tipo: 'Seguridad', descripcion: 'Test description long enough', sector: 'Test' });
      expect(res.status).toBe(401);
    });

    it('rejects invalid type', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'Invalid type test', tipo: 'Invalido', descripcion: 'Test description long enough', sector: 'Test' });
      expect(res.status).toBe(400);
    });

    it('creates alert with geolocation', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'Bache en avenida', tipo: 'Movilidad', descripcion: 'Bache grande en avenida principal', sector: 'Centro', lat: -34.6037, lng: -58.3816 });
      expect(res.status).toBe(201);
      expect(res.body.lat).toBe(-34.6037);
      expect(res.body.lng).toBe(-58.3816);
    });

    it('rejects titulo shorter than 5 chars', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'Hi', tipo: 'Otro', descripcion: 'Valid description here for test', sector: 'Test' });
      expect(res.status).toBe(400);
    });

    it('rejects titulo longer than 100 chars', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'A'.repeat(101), tipo: 'Otro', descripcion: 'Valid description here for test', sector: 'Test' });
      expect(res.status).toBe(400);
    });

    it('accepts titulo at exactly 5 chars (boundary)', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'ABCDE', tipo: 'Otro', descripcion: 'Valid description here for test', sector: 'Test' });
      expect(res.status).toBe(201);
    });

    it('accepts titulo at exactly 100 chars (boundary)', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ titulo: 'A'.repeat(100), tipo: 'Otro', descripcion: 'Valid description here for test', sector: 'Test' });
      expect(res.status).toBe(201);
    });

    it('rejects missing titulo', async () => {
      const res = await request(app)
        .post('/api/alertas')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ tipo: 'Otro', descripcion: 'Valid description here for test', sector: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/alertas', () => {
    let alertaTituloUnico;

    beforeAll(async () => {
      alertaTituloUnico = await Alerta.create({
        titulo: 'Alumbrado publico dañado en parque central',
        tipo: 'Infraestructura',
        descripcion: 'Several broken streetlights near the main park area',
        sector: 'Centro',
        autor: ciudadanoUser._id
      });
      await Alerta.create({
        titulo: 'Test alert title',
        tipo: 'Seguridad',
        descripcion: 'Test alert for listing',
        sector: 'TestSector',
        autor: ciudadanoUser._id
      });
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

    it('filters by search query on descripcion', async () => {
      const res = await request(app)
        .get('/api/alertas?q=listing')
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by search query on titulo', async () => {
      const res = await request(app)
        .get('/api/alertas?q=alumbrado')
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas.length).toBeGreaterThanOrEqual(1);
      const found = res.body.alertas.some(a => a.titulo && a.titulo.toLowerCase().includes('alumbrado'));
      expect(found).toBe(true);
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
      const a = await Alerta.create({ titulo: 'Test status change', tipo: 'Salud', descripcion: 'Test status change alert', sector: 'Test', autor: ciudadanoUser._id });
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
      const a = await Alerta.create({ titulo: 'Author close test', tipo: 'Infraestructura', descripcion: 'Author close test', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .patch(`/api/alertas/${a._id}/estado`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ estado: 'resuelto' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('resuelto');
    });

    it('ciudadano cannot change to en_revision', async () => {
      const a = await Alerta.create({ titulo: 'Cannot change status', tipo: 'Educacion', descripcion: 'Cannot change to review', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .patch(`/api/alertas/${a._id}/estado`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ estado: 'en_revision' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/alertas (soft delete)', () => {
    it('soft deletes an alert', async () => {
      const a = await Alerta.create({ titulo: 'Soft delete test', tipo: 'Otro', descripcion: 'Soft delete test alert', sector: 'Test', autor: ciudadanoUser._id });
      const res = await request(app)
        .delete(`/api/alertas/${a._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const check = await Alerta.findById(a._id);
      expect(check.eliminado).toBe(true);
    });

    it('soft deleted alerts dont appear in list', async () => {
      const a = await Alerta.create({ titulo: 'Hidden from list', tipo: 'Otro', descripcion: 'Hidden from list test', sector: 'Test', autor: ciudadanoUser._id });
      await request(app).delete(`/api/alertas/${a._id}`).set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/alertas')
        .set('Authorization', `Bearer ${adminToken}`);
      const found = res.body.alertas.find(x => x._id === a._id.toString());
      expect(found).toBeUndefined();
    });

    it('restores a soft deleted alert', async () => {
      const a = await Alerta.create({ titulo: 'Restore test alert', tipo: 'Otro', descripcion: 'Restore test alert here', sector: 'Test', autor: ciudadanoUser._id });
      await request(app).delete(`/api/alertas/${a._id}`).set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/api/alertas/${a._id}/restaurar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const check = await Alerta.findById(a._id);
      expect(check.eliminado).toBe(false);
    });
  });

  describe('POST /api/alertas/:id/comentarios', () => {
    let alertaForComments;

    beforeAll(async () => {
      const a = await Alerta.create({ titulo: 'Comment test alert', tipo: 'Seguridad', descripcion: 'Comment test alert here', sector: 'Test', autor: ciudadanoUser._id });
      alertaForComments = a;
    });

    it('creates a comment', async () => {
      const res = await request(app)
        .post(`/api/alertas/${alertaForComments._id}/comentarios`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ texto: 'Este es un comentario de prueba' });
      expect(res.status).toBe(201);
      expect(res.body.texto).toBe('Este es un comentario de prueba');
    });

    it('rejects empty comment', async () => {
      const res = await request(app)
        .post(`/api/alertas/${alertaForComments._id}/comentarios`)
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ texto: '' });
      expect(res.status).toBe(400);
    });

    it('gets comments for an alert', async () => {
      const res = await request(app)
        .get(`/api/alertas/${alertaForComments._id}/comentarios`)
        .set('Authorization', `Bearer ${ciudadanoToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/alertas/export', () => {
    it('exports CSV with correct content', async () => {
      const res = await request(app)
        .get('/api/alertas/export')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      const body = res.text;
      expect(body).toContain('ID,Titulo,Tipo,Descripcion,Sector,Estado,Autor,Fecha,Lat,Lng');
      expect(body).toContain('Robo en zona norte');
    });

    it('handles records with titulo correctly', async () => {
      const res = await request(app)
        .get('/api/alertas/export')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const lines = res.text.trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
      const dataLine = lines[1];
      const tituloMatch = dataLine.match(/^([^,]+),"([^"]*)",/);
      expect(tituloMatch).not.toBeNull();
      expect(tituloMatch[2].length).toBeGreaterThanOrEqual(1);
    });

    it('rejects export without token', async () => {
      const res = await request(app).get('/api/alertas/export');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('sends reset token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.resetToken).toBeDefined();
    });

    it('returns success even for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@test.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user data', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@test.com');
      expect(res.body.rol).toBe('administrador');
    });

    it('rejects without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/me', () => {
    it('updates nombre', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ nombre: 'Ciudadano Actualizado' });
      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe('Ciudadano Actualizado');
    });

    it('updates email', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ email: 'ciudadano.nuevo@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('ciudadano.nuevo@test.com');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ email: 'admin@test.com' });
      expect(res.status).toBe(409);
    });

    it('rejects empty update', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects nombre shorter than 2 chars', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ nombre: 'A' });
      expect(res.status).toBe(400);
    });

    it('rejects nombre longer than 100 chars', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${ciudadanoToken}`)
        .send({ nombre: 'X'.repeat(101) });
      expect(res.status).toBe(400);
    });
  });
});
