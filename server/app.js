require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = process.env.PORT || 4001;
const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'fusion.db');
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(DB_FILE);
const app = express();
app.use(cors());
app.use(bodyParser.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const upload = multer({ dest: uploadDir });
const JWT_SECRET = process.env.JWT_SECRET || 'troque_para_uma_chave_secreta';

function runSql(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function getSql(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err,row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function allSql(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err,rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
function generateToken(payload){
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth endpoints
app.post('/auth/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    const row = await getSql('SELECT u.id as id, u.password_hash as password_hash, p.role as role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.email=?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ id: row.id, email, role: row.role || 'aluno' });
    res.json({ token, user: { id: row.id, email, role: row.role || 'aluno' } });
  } catch(e){ console.error(e); res.status(500).json({ error: 'login failed' }); }
});
app.post('/auth/register', async (req,res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const r = await runSql('INSERT INTO users (email, password_hash) VALUES (?,?)', [email, hashed]);
    const userId = r.lastID;
    await runSql('INSERT INTO profiles (user_id, full_name, role) VALUES (?,?,?)', [userId, full_name||null, role||'aluno']);
    const token = generateToken({ id: userId, email, role: role||'aluno' });
    res.json({ token, user: { id: userId, email, role: role||'aluno' } });
  } catch(e){ console.error(e); res.status(500).json({ error: 'register failed' }); }
});

// generic selects/inserts
app.get('/api/:table', authMiddleware, async (req,res) => {
  try {
    const table = req.params.table;
    const rows = await allSql(`SELECT * FROM ${table}`);
    res.json(rows);
  } catch(e){ console.error(e); res.status(500).json({ error: 'failed' }); }
});
app.post('/api/:table', authMiddleware, async (req,res) => {
  try {
    const table = req.params.table;
    const data = req.body;
    const colsRow = await allSql(`PRAGMA table_info(${table})`);
    const cols = colsRow.map(c=>c.name);
    if (cols.includes('data')) {
      const r = await runSql(`INSERT INTO ${table} (user_id, data) VALUES (?,?)`, [req.user.id, JSON.stringify(data)]);
      res.json({ id: r.lastID });
    } else {
      return res.status(400).json({ error: 'table does not support generic insert via API' });
    }
  } catch(e){ console.error(e); res.status(500).json({ error: 'failed' }); }
});

// upload
app.post('/upload', authMiddleware, upload.single('file'), async (req,res) => {
  try { if (!req.file) return res.status(400).json({ error: 'no file' }); const url = `/uploads/${req.file.filename}`; res.json({ url, filename: req.file.filename }); }
  catch(e){ console.error(e); res.status(500).json({ error: 'upload failed' }); }
});

app.get('/me', authMiddleware, async (req,res)=> {
  const row = await getSql('SELECT u.id,u.email,p.full_name,p.avatar_url,p.role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?', [req.user.id]);
  res.json({ user: row });
});

app.listen(PORT, ()=> console.log('API listening on', PORT));
