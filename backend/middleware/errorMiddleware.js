const { logError } = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log error
  logError('Unhandled error', err, {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Tangani JSON error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid JSON format in request body'
    });
  }

  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorMiddleware;
