const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Buat format log standar
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// Buat logger utama
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'tagihan-air-api' },
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '5m',
      maxFiles: '14d' // Simpan 14 hari terakhir
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/%DATE%-combined.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '5m',
      maxFiles: '14d'
    })
  ]
});

// Tambahkan console log hanya di development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
    level: 'debug'
  }));
}

// Tangani error tak terduga
logger.exceptions.handle(
  new transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') })
);

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { error: reason });
});

// ==============================
// 🚀 Helper Logging Functions
// ==============================

const logInfo = (message, data = {}) => {
  logger.info(message, data);
};

const logWarn = (message, data = {}) => {
  logger.warn(message, data);
};

const logError = (message, error, context = {}) => {
  logger.error(message, {
    error: error?.message || error,
    stack: error?.stack,
    ...context
  });
};

const logDebug = (message, data = {}) => {
  logger.debug(message, data);
};

const logActivity = async (activityData) => {
  try {
    logger.info('Activity', activityData);
  } catch (error) {
    logger.error('Failed to log activity', { error: error.message, activityData });
  }
};

// ==============================
// Export
// ==============================

module.exports = {
  logger,
  logInfo,
  logWarn,
  logError,
  logDebug,
  logActivity
};
