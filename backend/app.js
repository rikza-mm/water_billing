const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger, logInfo, logError, logWarn } = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');
const routes = require('./routes');

const app = express();
app.set('trust proxy', 1);
// ==============================
// ✅ CORS Configuration
// ==============================
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Akses ditolak oleh kebijakan CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ==============================
// ✅ Middleware Dasar
// ==============================
app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// ✅ Helmet - Secure HTTP headers
// ==============================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://res.cloudinary.com",
        "https://api.cloudinary.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.cloudinary.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      mediaSrc: [
        "'self'",
        "https://res.cloudinary.com"
      ],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// ==============================
// ✅ Rate Limiter
// ==============================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login, akun Anda mungkin diblokir sementara.' },
});

// ==============================
// ✅ Middleware Logger Request
// ==============================
app.use(requestLogger);

// ==============================
// ✅ Routes
// ==============================
app.use('/api', apiLimiter);
app.use('/api/auth', loginLimiter);
app.use('/api', routes);

// ==============================
// ✅ 404 Handler
// ==============================
app.use((req, res, next) => {
  logWarn('404 Not Found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ==============================
// ✅ Error Handler
// ==============================
app.use(errorMiddleware);

// ==============================
// ✅ Start Server
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  logInfo(`🚀 Server berjalan di port ${PORT} [${process.env.NODE_ENV}]`);
});
