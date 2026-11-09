const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, description, ipAddress = '') => {
  try {
    await AuditLog.create({
      userId,
      action,
      description,
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
  }
};

module.exports = { logAudit };
