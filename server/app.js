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

// Ensure expected columns exist on users (lightweight migration)
async function ensureUserColumns() {
  try {
    const cols = await allSql("PRAGMA table_info(users)");
    const names = new Set(cols.map(c => c.name));
    const statements = [];

    if (!names.has('address')) statements.push("ALTER TABLE users ADD COLUMN address TEXT");
    if (!names.has('par_q_completed')) statements.push("ALTER TABLE users ADD COLUMN par_q_completed INTEGER DEFAULT 0");
    if (!names.has('par_q_has_risk')) statements.push("ALTER TABLE users ADD COLUMN par_q_has_risk INTEGER DEFAULT 0");
    if (!names.has('medical_certificate_url')) statements.push("ALTER TABLE users ADD COLUMN medical_certificate_url TEXT");
    if (!names.has('medical_certificate_required_date')) statements.push("ALTER TABLE users ADD COLUMN medical_certificate_required_date TEXT");
    if (!names.has('condominium_id')) statements.push("ALTER TABLE users ADD COLUMN condominium_id INTEGER");
    if (!names.has('account_blocked')) statements.push("ALTER TABLE users ADD COLUMN account_blocked INTEGER DEFAULT 0");

    for (const stmt of statements) {
      await runSql(stmt);
    }
  } catch (e) {
    console.error('ensureUserColumns failed', e);
  }
}

ensureUserColumns();

// Auth endpoints
app.post('/auth/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    const row = await getSql('SELECT u.id as id, u.password_hash as password_hash, u.user_type as user_type, p.role as role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.email=?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ id: row.id, email, role: row.role || 'aluno', user_type: row.user_type || null });
    res.json({ token, user: { id: row.id, email, role: row.role || 'aluno', user_type: row.user_type || null } });
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

    // Get table schema
    const colsRow = await allSql(`PRAGMA table_info(${table})`);
    const cols = colsRow.map(c=>c.name);

    // Build INSERT query dynamically
    const insertCols = cols.filter(col => col !== 'id' && col !== 'created_at' && data.hasOwnProperty(col));
    const placeholders = insertCols.map(() => '?').join(',');
    const values = insertCols.map(col => data[col]);

    // Add user_id if table has it and not provided
    if (cols.includes('user_id') && !data.user_id) {
      insertCols.push('user_id');
      values.push(req.user.id);
    }

    const sql = `INSERT INTO ${table} (${insertCols.join(',')}) VALUES (${placeholders})`;
    const r = await runSql(sql, values);
    res.json({ id: r.lastID });
  } catch(e){ console.error(e); res.status(500).json({ error: 'failed' }); }
});

app.put('/api/:table/:id', authMiddleware, async (req,res) => {
  try {
    const table = req.params.table;
    const id = req.params.id;
    const data = req.body;

    // Get table schema
    const colsRow = await allSql(`PRAGMA table_info(${table})`);
    const cols = colsRow.map(c=>c.name);

    // Build UPDATE query dynamically
    const updateCols = cols.filter(col => col !== 'id' && col !== 'created_at' && data.hasOwnProperty(col));
    const setClause = updateCols.map(col => `${col} = ?`).join(',');
    const values = updateCols.map(col => data[col]);
    values.push(id); // Add ID for WHERE clause

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    await runSql(sql, values);
    res.json({ success: true });
  } catch(e){ console.error(e); res.status(500).json({ error: 'failed' }); }
});

app.delete('/api/:table/:id', authMiddleware, async (req,res) => {
  try {
    const table = req.params.table;
    const id = req.params.id;
    await runSql(`DELETE FROM ${table} WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch(e){ console.error(e); res.status(500).json({ error: 'failed' }); }
});

// upload
app.post('/upload', authMiddleware, upload.single('file'), async (req,res) => {
  try { if (!req.file) return res.status(400).json({ error: 'no file' }); const url = `/uploads/${req.file.filename}`; res.json({ url, filename: req.file.filename }); }
  catch(e){ console.error(e); res.status(500).json({ error: 'upload failed' }); }
});

app.get('/me', authMiddleware, async (req,res)=> {
  const row = await getSql('SELECT u.id,u.email,u.user_type,p.full_name,p.avatar_url,p.role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?', [req.user.id]);
  res.json({ user: row });
});

// Update profile/user data
app.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body || {};

    // Split fields between users and profiles
    const userAllowed = ['user_type','cpf','phone','plan_status','address','par_q_completed','par_q_has_risk','medical_certificate_url','medical_certificate_required_date','condominium_id','account_blocked'];
    const profileAllowed = ['full_name','avatar_url','role'];

    const userUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => userAllowed.includes(k)));
    const profileUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => profileAllowed.includes(k)));

    // Normalize booleans to 0/1 for SQLite
    if (typeof userUpdates.par_q_completed === 'boolean') userUpdates.par_q_completed = userUpdates.par_q_completed ? 1 : 0;
    if (typeof userUpdates.par_q_has_risk === 'boolean') userUpdates.par_q_has_risk = userUpdates.par_q_has_risk ? 1 : 0;
    if (typeof userUpdates.account_blocked === 'boolean') userUpdates.account_blocked = userUpdates.account_blocked ? 1 : 0;

    // Update users table
    if (Object.keys(userUpdates).length > 0) {
      const setCols = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
      const values = Object.keys(userUpdates).map(k => userUpdates[k]);
      values.push(userId);
      await runSql(`UPDATE users SET ${setCols} WHERE id = ?`, values);
    }

    // Ensure profile exists
    const prof = await getSql('SELECT id FROM profiles WHERE user_id = ?', [userId]);
    if (!prof) {
      await runSql('INSERT INTO profiles (user_id) VALUES (?)', [userId]);
    }

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      const setCols = Object.keys(profileUpdates).map(k => `${k} = ?`).join(', ');
      const values = Object.keys(profileUpdates).map(k => profileUpdates[k]);
      values.push(userId);
      await runSql(`UPDATE profiles SET ${setCols} WHERE user_id = ?`, values);
    }

    // Return updated snapshot similar to /me
    const row = await getSql('SELECT u.id,u.email,u.user_type,u.cpf,u.phone,u.plan_status,u.address,u.par_q_completed,u.par_q_has_risk,u.medical_certificate_url,u.medical_certificate_required_date,u.condominium_id,u.account_blocked,p.full_name,p.avatar_url,p.role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?', [userId]);
    res.json({ user: row, success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'profile update failed' });
  }
});

app.listen(PORT, ()=> console.log('API listening on', PORT));
