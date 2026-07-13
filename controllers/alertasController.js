const Alerta = require('../models/Alerta');
const Comentario = require('../models/Comentario');

exports.stats = async (req, res, next) => {
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
    const porMes = await Alerta.aggregate([
      { $match: filtroBase },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$fecha' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      total,
      porEstado: Object.fromEntries(porEstado.map(e => [e._id, e.count])),
      porTipo: Object.fromEntries(porTipo.map(t => [t._id, t.count])),
      porMes: porMes.map(m => ({ mes: m._id, count: m.count })),
      recientes
    });
  } catch (error) {
    next(error);
  }
};

exports.exportar = async (req, res, next) => {
  try {
    const alertas = await Alerta.find({ eliminado: { $ne: true } })
      .sort({ fecha: -1 })
      .populate('autor', 'nombre email')
      .lean();

    const header = 'ID,Tipo,Descripcion,Sector,Estado,Autor,Fecha,Lat,Lng\n';
    const rows = alertas.map(a => {
      const fecha = new Date(a.fecha).toISOString();
      const desc = `"${(a.descripcion || '').replace(/"/g, '""')}"`;
      const autor = a.autor?.nombre || 'Anonimo';
      return `${a._id},${a.tipo},${desc},${a.sector},${a.estado},${autor},${fecha},${a.lat || ''},${a.lng || ''}`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ciudadalerta_reportes.csv');
    res.send('\uFEFF' + header + rows);
  } catch (error) {
    next(error);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const { sector, tipo, estado, q, page = 1, limit = 20, fechaDesde, fechaHasta, lat, lng, radio } = req.query;
    const filtro = { eliminado: { $ne: true } };
    if (sector) filtro.sector = { $regex: sector.trim(), $options: 'i' };
    if (tipo) filtro.tipo = { $regex: `^${tipo.trim()}$`, $options: 'i' };
    if (estado) filtro.estado = estado;
    if (q) filtro.descripcion = { $regex: q.trim(), $options: 'i' };
    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = Alerta.find(filtro);

    if (lat && lng && radio) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radioKm = parseFloat(radio) || 10;
      const radLat = latNum * Math.PI / 180;
      const dLat = (radioKm / 6371) * (180 / Math.PI);
      const dLng = (radioKm / (6371 * Math.cos(radLat))) * (180 / Math.PI);

      filtro.lat = { $gte: latNum - dLat, $lte: latNum + dLat };
      filtro.lng = { $gte: lngNum - dLng, $lte: lngNum + dLng };
      query = Alerta.find(filtro);
    }

    const [alertas, total] = await Promise.all([
      query.sort({ fecha: -1 }).skip(skip).limit(limitNum).populate('autor', 'nombre').lean(),
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
    next(error);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const alerta = await Alerta.findOne({ _id: req.params.id, eliminado: { $ne: true } }).populate('autor', 'nombre email').lean();
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    const comentarios = await Comentario.find({ alerta: alerta._id })
      .populate('autor', 'nombre rol')
      .sort({ fecha: -1 })
      .lean();
    res.json({ ...alerta, comentarios });
  } catch (error) {
    next(error);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { tipo, descripcion, sector, lat, lng } = req.body;

    const tipoNormalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();

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
    next(error);
  }
};

exports.cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
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
    next(error);
  }
};

exports.eliminar = async (req, res, next) => {
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
    next(error);
  }
};

exports.restaurar = async (req, res, next) => {
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
    next(error);
  }
};
