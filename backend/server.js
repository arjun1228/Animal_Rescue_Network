const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { startAutoReleaseCron } = require('./jobs/autoRelease');
const { startCampaignExpiryCron } = require('./jobs/campaignExpiry');

dotenv.config();

// ── Required env-var startup check ───────────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:\n   ${missing.join(', ')}\n`);
  console.error('   Copy .env.example → .env and fill in the values.\n');
  process.exit(1);
}

connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Rate limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for dev/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for dev/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for dev/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registrations from this IP, please try again in 1 hour.' },
});

const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 donations per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many donations from this IP, please try again later.' },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter); // apply globally
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Auth routes with tighter limits ──────────────────────────────────────────
const authRouter = require('./routes/auth');
authRouter.post('/login', loginLimiter);       // tighter limit on login
authRouter.post('/register', registerLimiter); // tighter limit on register
app.use('/api/auth', authRouter);

// ── Other routes ──────────────────────────────────────────────────────────────
app.use('/api/rescue', require('./routes/rescue'));
app.use('/api/donation', require('./routes/donation')(donationLimiter));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/volunteer', require('./routes/volunteer'));

// Start background jobs
startAutoReleaseCron();
startCampaignExpiryCron();

// Health check
app.get('/', (req, res) => res.json({ message: 'Animal Rescue Network API is running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
