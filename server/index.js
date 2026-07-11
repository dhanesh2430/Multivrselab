require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { initSocket } = require('./sockets/socketHandler');
const setupSwagger = require('./swagger');

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://multivrselab.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Swagger Documentation
setupSwagger(app);

// ── Routes ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  message: 'LeaderHabit Backend API is running! 🚀',
  frontend: 'Please open the frontend application in your browser at http://localhost:5173',
  health: 'http://localhost:5000/health'
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 Handler ─────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// ── Global Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

// ── Database + Socket.io + Server Bootstrap ─────────────────────────────
const PORT = process.env.PORT || 5000;
const CONFIGURED_MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/habittracker';

const startServer = (mongoUri) => {
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Frontend: http://localhost:5173`);
  });
};

const connectDB = async () => {
  // 1. Try the configured URI first
  try {
    await mongoose.connect(CONFIGURED_MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[DB] Connected to MongoDB at ${CONFIGURED_MONGO_URI}`);
    startServer(CONFIGURED_MONGO_URI);
  } catch (primaryErr) {
    // 2. Fall back to in-memory MongoDB (no install needed)
    console.warn(`[DB] Could not connect to ${CONFIGURED_MONGO_URI}: ${primaryErr.message}`);
    console.log('[DB] Starting in-memory MongoDB (mongodb-memory-server)...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`[DB] ✅ In-memory MongoDB running at ${memUri}`);
      console.log('[DB] ⚠️  Data will be lost when the server stops. Install MongoDB for persistence.');
      startServer(memUri);
    } catch (fallbackErr) {
      console.error('[DB] In-memory MongoDB also failed:', fallbackErr.message);
      process.exit(1);
    }
  }
};

connectDB();
