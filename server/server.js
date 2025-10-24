// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3001').split(',');
app.use(cors({ origin: (origin, cb) => cb(null, ALLOWED_ORIGINS.includes(origin) || !origin), credentials: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Seed demo user if none exists (email: demo@demo.com / senha: demo123)
(function seed() {
  const row = db.prepare('SELECT COUNT(1) as c FROM users').get();
  if ((row?.c || 0) === 0) {
    const hash = bcrypt.hashSync('demo123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run('Demo User', 'demo@demo.com', hash);
    db.prepare('INSERT INTO something (title) VALUES (?)').run('Primeiro registro');
  }
})();

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Example protected route
app.get('/api/something', authMiddleware, (_req, res) => {
  const rows = db.prepare('SELECT * FROM something ORDER BY id DESC').all();
  res.json(rows);
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));