require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const menuRoutes = require('./routes/menuRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const crowdRoutes = require('./routes/crowdRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mlRoutes = require('./routes/mlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const wasteRoutes = require('./routes/wasteRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const qrRoutes = require('./routes/qrRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Database ──────────────────────────────────────────────────────────────
connectDB().then(async () => {
  const seedMenuAndDailyItems = require('./utils/seeder');
  const seedEnhancedData = require('./utils/enhancedSeeder');
  await seedMenuAndDailyItems().catch((err) => console.error('❌ Seeding failed on startup:', err));
  await seedEnhancedData().catch((err) => console.error('❌ Enhanced seeding failed:', err));
});

// ─── Rate limiter (auth endpoints only) ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Middleware ─────────────────────────────────────────────────────────────
const localIpPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (localIpPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy mismatch.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/qr', qrRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'HMMS API is running', timestamp: new Date().toISOString() })
);

// 404 catch-all
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅  HMMS server running on http://localhost:${PORT}`)
);