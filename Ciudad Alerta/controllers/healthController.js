const mongoose = require('mongoose');

exports.health = async (req, res) => {
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
};
