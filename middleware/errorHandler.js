function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la solicitud es demasiado grande' });
  }

  if (err.message && err.message.includes('Solo se permiten imagenes')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el limite de 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximo 3 archivos permitidos' });
    }
    return res.status(400).json({ error: `Error de upload: ${err.message}` });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'ID de formato invalido' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;
