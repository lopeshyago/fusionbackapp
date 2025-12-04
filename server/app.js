require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Minimal schema safety/migrations
async function ensureSchemaColumns() {
  try {
    // users extra columns
    const uCols = await allSql('PRAGMA table_info(users)');
    const uNames = new Set(uCols.map(c => c.name));
    if (!uNames.has('user_type')) await runSql('ALTER TABLE users ADD COLUMN user_type TEXT');
    if (!uNames.has('cpf')) await runSql('ALTER TABLE users ADD COLUMN cpf TEXT');
    if (!uNames.has('phone')) await runSql('ALTER TABLE users ADD COLUMN phone TEXT');
    if (!uNames.has('plan_status')) await runSql("ALTER TABLE users ADD COLUMN plan_status TEXT DEFAULT 'active'");
    if (!uNames.has('address')) await runSql('ALTER TABLE users ADD COLUMN address TEXT');
    if (!uNames.has('par_q_completed')) await runSql('ALTER TABLE users ADD COLUMN par_q_completed INTEGER DEFAULT 0');
    if (!uNames.has('par_q_has_risk')) await runSql('ALTER TABLE users ADD COLUMN par_q_has_risk INTEGER DEFAULT 0');
    if (!uNames.has('medical_certificate_url')) await runSql('ALTER TABLE users ADD COLUMN medical_certificate_url TEXT');
    if (!uNames.has('medical_certificate_required_date')) await runSql('ALTER TABLE users ADD COLUMN medical_certificate_required_date TEXT');
    if (!uNames.has('condominium_id')) await runSql('ALTER TABLE users ADD COLUMN condominium_id INTEGER');
    if (!uNames.has('account_blocked')) await runSql('ALTER TABLE users ADD COLUMN account_blocked INTEGER DEFAULT 0');

    // condominiums extras
    const cCols = await allSql('PRAGMA table_info(condominiums)');
    const cNames = new Set(cCols.map(c => c.name));
    if (!cNames.has('areas')) await runSql('ALTER TABLE condominiums ADD COLUMN areas TEXT');
    if (!cNames.has('cep')) await runSql('ALTER TABLE condominiums ADD COLUMN cep TEXT');
    if (!cNames.has('rules')) await runSql('ALTER TABLE condominiums ADD COLUMN rules TEXT');
    if (!cNames.has('is_active')) await runSql('ALTER TABLE condominiums ADD COLUMN is_active INTEGER DEFAULT 1');
    if (!cNames.has('invite_code')) {
      await runSql('ALTER TABLE condominiums ADD COLUMN invite_code TEXT');
      await runSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_condominiums_invite_code ON condominiums(invite_code)');
    }

    // weekly_schedules table (used by grade de horários)
    await runSql(
      `CREATE TABLE IF NOT EXISTS weekly_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        condominium_id INTEGER,
        day_of_week TEXT,
        time TEXT,
        activity_name TEXT,
        duration INTEGER,
        capacity INTEGER,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
      )`
    );
    const wsCols = await allSql('PRAGMA table_info(weekly_schedules)');
    const wsNames = new Set(wsCols.map(c => c.name));
    if (!wsNames.has('condominium_id')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN condominium_id INTEGER');
    if (!wsNames.has('time')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN time TEXT');
    if (!wsNames.has('activity_name')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN activity_name TEXT');
    if (!wsNames.has('duration')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN duration INTEGER');
    if (!wsNames.has('capacity')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN capacity INTEGER');
    if (!wsNames.has('color')) await runSql('ALTER TABLE weekly_schedules ADD COLUMN color TEXT');

    // instructor_invites columns
    const iiCols = await allSql('PRAGMA table_info(instructor_invites)');
    const iiNames = new Set(iiCols.map(c => c.name));
    if (!iiNames.has('email')) await runSql("ALTER TABLE instructor_invites ADD COLUMN email TEXT DEFAULT '' NOT NULL");
    if (!iiNames.has('invited_by')) await runSql('ALTER TABLE instructor_invites ADD COLUMN invited_by INTEGER');
    if (!iiNames.has('status')) await runSql('ALTER TABLE instructor_invites ADD COLUMN status TEXT');
    if (!iiNames.has('code')) await runSql('ALTER TABLE instructor_invites ADD COLUMN code TEXT');
    if (!iiNames.has('expires_at')) await runSql('ALTER TABLE instructor_invites ADD COLUMN expires_at TEXT');
    if (!iiNames.has('created_at')) await runSql('ALTER TABLE instructor_invites ADD COLUMN created_at TEXT');

    // admin_invites columns
    const aiCols = await allSql('PRAGMA table_info(admin_invites)');
    const aiNames = new Set(aiCols.map(c => c.name));
    if (!aiNames.has('code')) await runSql('ALTER TABLE admin_invites ADD COLUMN code TEXT');
    if (!aiNames.has('type')) await runSql('ALTER TABLE admin_invites ADD COLUMN type TEXT');
    if (!aiNames.has('expires_at')) await runSql('ALTER TABLE admin_invites ADD COLUMN expires_at TEXT');

    // notices extra fields expected by UI
    const nCols = await allSql('PRAGMA table_info(notices)');
    const nNames = new Set(nCols.map(c => c.name));
    if (!nNames.has('type')) await runSql("ALTER TABLE notices ADD COLUMN type TEXT");
    if (!nNames.has('target_audience')) await runSql("ALTER TABLE notices ADD COLUMN target_audience TEXT DEFAULT 'all'");
    if (!nNames.has('is_active')) await runSql("ALTER TABLE notices ADD COLUMN is_active INTEGER DEFAULT 1");
    if (!nNames.has('valid_until')) await runSql("ALTER TABLE notices ADD COLUMN valid_until TEXT");
    if (!nNames.has('created_date')) await runSql("ALTER TABLE notices ADD COLUMN created_date TEXT");

    // profiles extra fields
    const pCols = await allSql('PRAGMA table_info(profiles)');
    const pNames = new Set(pCols.map(c => c.name));
    if (!pNames.has('sex')) await runSql('ALTER TABLE profiles ADD COLUMN sex TEXT');

    // PAR-Q tables used by StudentSetup/Parq pages
    await runSql(
      `CREATE TABLE IF NOT EXISTS parq_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT,
        "order" INTEGER
      )`
    );
    await runSql(
      `CREATE TABLE IF NOT EXISTS parq_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        completed_at TEXT,
        expires_at TEXT,
        answers TEXT,
        has_risk_factors INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );
  } catch (e) {
    console.error('ensureSchemaColumns failed', e);
  }
}
ensureSchemaColumns();

// Admin create user
app.post('/admin/users', authMiddleware, async (req, res) => {
  try {
    const { email, full_name, phone, user_type, condominium_id, cpf } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const hashed = bcrypt.hashSync('123456', 10);
    const r = await runSql(
      'INSERT INTO users (email, password_hash, user_type, phone, cpf, condominium_id) VALUES (?,?,?,?,?,?)',
      [email, hashed, user_type || 'student', phone || null, cpf || null, condominium_id || null]
    ); // Adicionado 'cpf'
    const userId = r.lastID;
    await runSql('INSERT INTO profiles (user_id, full_name, role) VALUES (?,?,?)', [userId, full_name || null, (user_type === 'admin' ? 'admin' : (user_type === 'instructor' ? 'instrutor' : 'aluno'))]);
    res.json({ id: userId });
  } catch (e) { console.error(e); res.status(500).json({ error: 'admin create failed' }); }
});

// Auth endpoints
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = await getSql('SELECT u.id as id, u.password_hash as password_hash, u.user_type as user_type, p.role as role FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.email=?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, row.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ id: row.id, email, role: row.role || 'aluno', user_type: row.user_type || null });
    res.json({ token, user: { id: row.id, email, role: row.role || 'aluno', user_type: row.user_type || null } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'login failed' }); }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hashed = bcrypt.hashSync(password, 10);
    const r = await runSql('INSERT INTO users (email, password_hash) VALUES (?,?)', [email, hashed]);
    const userId = r.lastID;
    await runSql('INSERT INTO profiles (user_id, full_name, role) VALUES (?,?,?)', [userId, full_name || null, role || 'aluno']);
    const token = generateToken({ id: userId, email, role: role || 'aluno' });
    res.json({ token, user: { id: userId, email, role: role || 'aluno' } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'register failed' }); }
});

// Student/Instructor registration
app.post('/register/student', async (req, res) => {
  try {
    const { email, password, full_name, condo_code } = req.body || {};
    if (!email || !password || !condo_code) return res.status(400).json({ error: 'Missing fields' });
    const condo = await getSql('SELECT id FROM condominiums WHERE invite_code = ?', [condo_code]);
    if (!condo) return res.status(400).json({ error: 'Invalid condominium code' });
    const hashed = bcrypt.hashSync(password, 10);
    const r = await runSql('INSERT INTO users (email, password_hash, user_type, condominium_id) VALUES (?,?,?,?)', [email, hashed, 'student', condo.id]);
    const userId = r.lastID;
    await runSql('INSERT INTO profiles (user_id, full_name, role) VALUES (?,?,?)', [userId, full_name || null, 'aluno']);
    const token = generateToken({ id: userId, email, role: 'aluno', user_type: 'student' });
    res.json({ token, user: { id: userId, email, role: 'aluno', user_type: 'student' } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'student register failed' }); }
});

app.post('/register/instructor', async (req, res) => {
  try {
    const { email, password, full_name, invite_code } = req.body || {};
    if (!email || !password || !invite_code) return res.status(400).json({ error: 'Missing fields' });
    const invite = await getSql('SELECT id, status FROM instructor_invites WHERE code = ?', [invite_code]);
    if (!invite || invite.status !== 'pending') return res.status(400).json({ error: 'Invalid or used invite' });
    const hashed = bcrypt.hashSync(password, 10);
    const r = await runSql('INSERT INTO users (email, password_hash, user_type) VALUES (?,?,?)', [email, hashed, 'instructor']);
    const userId = r.lastID;
    await runSql('INSERT INTO profiles (user_id, full_name, role) VALUES (?,?,?)', [userId, full_name || null, 'instrutor']);
    await runSql('UPDATE instructor_invites SET status = ? WHERE id = ?', ['used', invite.id]);
    const token = generateToken({ id: userId, email, role: 'instrutor', user_type: 'instructor' });
    res.json({ token, user: { id: userId, email, role: 'instrutor', user_type: 'instructor' } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'instructor register failed' }); }
});

// Invites
app.post('/invites/instructor', authMiddleware, async (req, res) => {
  try {
    const { email, days, code } = req.body || {};
    const invitedBy = req.user?.id || null;
    const inviteCode = (code && String(code).trim()) || `FUSION-INST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const ttlDays = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
    await runSql('INSERT INTO instructor_invites (email, invited_by, status, code, expires_at, created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)', [email || '', invitedBy, 'pending', inviteCode, expiresAt]);
    const row = await getSql('SELECT * FROM instructor_invites WHERE code = ?', [inviteCode]);
    res.json({ invite: row });
  } catch (e) { console.error(e); res.status(500).json({ error: 'invite create failed' }); }
});

app.get('/invites/instructor', authMiddleware, async (_req, res) => {
  try {
    const rows = await allSql('SELECT * FROM instructor_invites ORDER BY id DESC');
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'invite list failed' }); }
});

// Generic CRUD
app.get('/api/:table', authMiddleware, async (req, res) => {
  try {
    const table = req.params.table;
    let rows = await allSql(`SELECT * FROM ${table}`);
    // Normalize certain tables
    if (table === 'condominiums') {
      rows = rows.map(r => {
        if (typeof r.areas === 'string' && r.areas) {
          try {
            const parsed = JSON.parse(r.areas);
            r.areas = Array.isArray(parsed) ? parsed : [String(parsed)];
          } catch {
            // Fallback: comma-separated string
            r.areas = r.areas.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (!Array.isArray(r.areas)) {
          r.areas = [];
        }
        return r;
      });
    }
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

// Admin: full users listing with profile join
app.get('/admin/users_full', authMiddleware, async (_req, res) => {
  try {
    const rows = await allSql('SELECT u.id,u.email,u.user_type,u.phone,u.cpf,u.condominium_id,p.full_name,p.avatar_url,p.role,p.sex FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.id DESC');
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

// Instructor: students list (same condominium)
app.get('/instructor/students', authMiddleware, async (req, res) => {
  try {
    const me = await getSql('SELECT condominium_id FROM users WHERE id = ?', [req.user.id]);
    if (!me || !me.condominium_id) return res.json([]);
    const rows = await allSql('SELECT u.id, u.email, u.phone, u.cpf, p.full_name, p.avatar_url, p.sex FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.user_type = ? AND u.condominium_id = ? ORDER BY p.full_name ASC', ['student', me.condominium_id]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

app.post('/api/:table', authMiddleware, async (req, res) => {
  try {
    const table = req.params.table;
    if (table === 'instructor_invites') {
      const { email, days, code } = req.body || {};
      const invitedBy = req.user?.id || null;
      const inviteCode = (code && String(code).trim()) || `FUSION-INST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const ttlDays = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : 7;
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
      // Adicionado para suportar o novo formato de admin_invites
      if (table === 'admin_invites') {
          await runSql('INSERT INTO admin_invites (code, type, expires_at, status, created_by) VALUES (?, ?, ?, ?, ?)', [inviteCode, data.type || 'instructor', expiresAt, 'pending', req.user?.id]);
          const row = await getSql('SELECT * FROM admin_invites WHERE code = ?', [inviteCode]);
          return res.json({ id: row?.id, invite: row });
      }
      await runSql('INSERT INTO instructor_invites (email, invited_by, status, code, expires_at, created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)', [email || '', invitedBy, 'pending', inviteCode, expiresAt]);
      const row = await getSql('SELECT * FROM instructor_invites WHERE code = ?', [inviteCode]);
      return res.json({ id: row?.id, invite: row });
    }
    const data = req.body || {};
    const colsRow = await allSql(`PRAGMA table_info(${table})`);
    const cols = colsRow.map(c => c.name);
    const defaults = {};
    if (table === 'notices') {
      if (cols.includes('title') && !('title' in data)) defaults.title = 'Aviso';
      if (cols.includes('content') && !('content' in data)) defaults.content = '';
      if (cols.includes('type') && !('type' in data)) defaults.type = 'info';
      if (cols.includes('target_audience') && !('target_audience' in data)) defaults.target_audience = 'all';
      if (cols.includes('is_active') && !('is_active' in data)) defaults.is_active = 1;
      if (cols.includes('created_date') && !('created_date' in data)) defaults.created_date = new Date().toISOString();
    }
    if (table === 'weekly_schedules') {
      if (cols.includes('day_of_week') && !('day_of_week' in data)) defaults.day_of_week = 'Segunda';
      if (cols.includes('time') && !('time' in data)) defaults.time = '08:00';
      if (cols.includes('activity_name') && !('activity_name' in data)) defaults.activity_name = 'Atividade';
      if (cols.includes('duration') && !('duration' in data)) defaults.duration = 60;
      if (cols.includes('capacity') && !('capacity' in data)) defaults.capacity = 15;
      if (cols.includes('color') && !('color' in data)) defaults.color = 'bg-orange-500';
    }
    if (table === 'posts') {
      if (cols.includes('content') && !('content' in data)) defaults.content = '';
      if (cols.includes('media_url') && !('media_url' in data)) defaults.media_url = null;
    }
    const safeData = { ...defaults, ...data };
    const insertCols = [];
    const values = [];
    for (const col of cols) {
      if (col === 'id' || col === 'created_at') continue;
      if (Object.prototype.hasOwnProperty.call(safeData, col)) {
        const v = safeData[col];
        values.push(Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : v);
        insertCols.push(col);
      }
    }
    if (cols.includes('user_id') && !Object.prototype.hasOwnProperty.call(safeData, 'user_id')) {
      insertCols.push('user_id');
      values.push(req.user?.id ?? null);
    }
    if (insertCols.length === 0) {
      const r = await runSql(`INSERT INTO ${table} DEFAULT VALUES`);
      return res.json({ id: r.lastID });
    }
    const placeholders = insertCols.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${insertCols.join(',')}) VALUES (${placeholders})`;
    const r = await runSql(sql, values);
    res.json({ id: r.lastID });
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

app.put('/api/:table/:id', authMiddleware, async (req, res) => {
  try {
    const table = req.params.table;
    const id = req.params.id;
    const data = req.body || {};

    if (table === 'users') {
      const userAllowed = ['user_type','cpf','phone','plan_status','address','par_q_completed','par_q_has_risk','medical_certificate_url','medical_certificate_required_date','condominium_id','account_blocked'];
      const profileAllowed = ['full_name','avatar_url','role'];
      const userUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => userAllowed.includes(k)));
      const profileUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => profileAllowed.includes(k)));
      if (typeof userUpdates.par_q_completed === 'boolean') userUpdates.par_q_completed = userUpdates.par_q_completed ? 1 : 0;
      if (typeof userUpdates.par_q_has_risk === 'boolean') userUpdates.par_q_has_risk = userUpdates.par_q_has_risk ? 1 : 0;
      if (typeof userUpdates.account_blocked === 'boolean') userUpdates.account_blocked = userUpdates.account_blocked ? 1 : 0;
      if (Object.keys(userUpdates).length > 0) {
        const setCols = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.keys(userUpdates).map(k => userUpdates[k]);
        values.push(id);
        await runSql(`UPDATE users SET ${setCols} WHERE id = ?`, values);
      }
      const prof = await getSql('SELECT id FROM profiles WHERE user_id = ?', [id]);
      if (!prof) await runSql('INSERT INTO profiles (user_id) VALUES (?)', [id]);
      if (Object.keys(profileUpdates).length > 0) {
        const setColsP = Object.keys(profileUpdates).map(k => `${k} = ?`).join(', ');
        const valuesP = Object.keys(profileUpdates).map(k => profileUpdates[k]);
        valuesP.push(id);
        await runSql(`UPDATE profiles SET ${setColsP} WHERE user_id = ?`, valuesP);
      }
      return res.json({ success: true });
    }

    const colsRow = await allSql(`PRAGMA table_info(${table})`);
    const cols = colsRow.map(c => c.name);
    const updateCols = cols.filter(col => col !== 'id' && col !== 'created_at' && Object.prototype.hasOwnProperty.call(data, col));
    if (updateCols.length === 0) return res.status(400).json({ error: 'no updatable fields' });
    const setClause = updateCols.map(col => `${col} = ?`).join(',');
    const values = updateCols.map(col => {
      const v = data[col];
      if (Array.isArray(v) || (v && typeof v === 'object')) return JSON.stringify(v);
      return v;
    });
    values.push(id);
    await runSql(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

app.post('/api/maintenance_requests', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const data = req.body || {};
    if (req.file) data.image_url = `/uploads/${req.file.filename}`;
    const { title, description, equipment, location, image_url } = data;
    const r = await runSql('INSERT INTO maintenance_requests (user_id, title, description, equipment, location, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.id, title, description, equipment, location, image_url, 'open']);
    res.json({ id: r.lastID });
  } catch (e) {
    console.error('Erro ao criar chamado de manutenção:', e);
    res.status(500).json({ error: 'failed to create maintenance request' });
  }
});

app.put('/api/notices/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, target_audience, is_active, valid_until } = req.body;
    await runSql(
      'UPDATE notices SET title = ?, content = ?, type = ?, target_audience = ?, is_active = ?, valid_until = ? WHERE id = ?',
      [title, content, type, target_audience, is_active, valid_until, id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('notice update failed', e); res.status(500).json({ error: 'failed' });
  }
});

app.put('/api/physical_assessments/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const fields = Object.keys(data).filter(k => k !== 'id');
        const setClause = fields.map(k => `${k} = ?`).join(', ');
        const values = fields.map(k => data[k]);
        await runSql(`UPDATE physical_assessments SET ${setClause} WHERE id = ?`, [...values, id]);
        res.json({ success: true });
    } catch(e) { console.error(e); res.status(500).json({ error: 'update failed' }); }
});

app.delete('/api/:table/:id', authMiddleware, async (req, res) => {
  try {
    const table = req.params.table;
    const id = req.params.id;
    await runSql(`DELETE FROM ${table} WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed' }); }
});

// upload
app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (e) { console.error(e); res.status(500).json({ error: 'upload failed' }); }
});

app.get('/me', authMiddleware, async (req, res) => {
  const row = await getSql('SELECT u.id,u.email,u.user_type,u.phone,u.cpf,u.address,u.condominium_id,p.full_name,p.avatar_url,p.role,p.sex FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?', [req.user.id]);
  res.json({ user: row });
});

// Update current user profile
app.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body || {};
    const userAllowed = ['user_type','cpf','phone','plan_status','address','par_q_completed','par_q_has_risk','medical_certificate_url','medical_certificate_required_date','condominium_id','account_blocked'];
    const profileAllowed = ['full_name','avatar_url','role','sex'];
    const userUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => userAllowed.includes(k)));
    const profileUpdates = Object.fromEntries(Object.entries(data).filter(([k]) => profileAllowed.includes(k)));
    if (typeof userUpdates.par_q_completed === 'boolean') userUpdates.par_q_completed = userUpdates.par_q_completed ? 1 : 0;
    if (typeof userUpdates.par_q_has_risk === 'boolean') userUpdates.par_q_has_risk = userUpdates.par_q_has_risk ? 1 : 0;
    if (typeof userUpdates.account_blocked === 'boolean') userUpdates.account_blocked = userUpdates.account_blocked ? 1 : 0;
    if (Object.keys(userUpdates).length > 0) {
      const setCols = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
      const values = Object.keys(userUpdates).map(k => userUpdates[k]);
      values.push(userId);
      await runSql(`UPDATE users SET ${setCols} WHERE id = ?`, values);
    }
    const prof = await getSql('SELECT id FROM profiles WHERE user_id = ?', [userId]);
    if (!prof) await runSql('INSERT INTO profiles (user_id) VALUES (?)', [userId]);
    if (Object.keys(profileUpdates).length > 0) {
      const setColsP = Object.keys(profileUpdates).map(k => `${k} = ?`).join(', ');
      const valuesP = Object.keys(profileUpdates).map(k => profileUpdates[k]);
      valuesP.push(userId);
      await runSql(`UPDATE profiles SET ${setColsP} WHERE user_id = ?`, valuesP);
    }
    const row = await getSql('SELECT u.id,u.email,u.user_type,u.cpf,u.phone,u.plan_status,u.address,u.par_q_completed,u.par_q_has_risk,u.medical_certificate_url,u.medical_certificate_required_date,u.condominium_id,u.account_blocked,p.full_name,p.avatar_url,p.role,p.sex FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?', [userId]);
    res.json({ user: row, success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'profile update failed' }); }
});

// Serve frontend
try {
  const clientDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));

    // favicon fallbacks
    app.get('/favicon.ico', (_req, res) => {
      const fav = path.join(clientDir, 'favicon.ico');
      const alt = path.join(clientDir, 'fusionico.ico');
      if (fs.existsSync(fav)) return res.type('image/x-icon').sendFile(fav);
      if (fs.existsSync(alt)) return res.type('image/x-icon').sendFile(alt);
      res.type('image/x-icon').status(200).end();
    });
    app.get('/fusionico.ico', (_req, res) => {
      const alt = path.join(clientDir, 'fusionico.ico');
      const fav = path.join(clientDir, 'favicon.ico');
      if (fs.existsSync(alt)) return res.type('image/x-icon').sendFile(alt);
      if (fs.existsSync(fav)) return res.type('image/x-icon').sendFile(fav);
      res.type('image/x-icon').status(200).end();
    });

    // PWA minimal endpoints
    app.get('/components/pwa/sw.js', (_req, res) => {
      res.type('application/javascript').send('self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",()=>self.clients.claim());');
    });
    app.get('/components/pwa/manifest.webmanifest', (_req, res) => {
      res.type('application/manifest+json').send(JSON.stringify({
        name: 'Fusion App', short_name: 'Fusion', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#f97316',
        icons: [ { src: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' }, { src: '/fusionlogo.png', sizes: '512x512', type: 'image/png' } ]
      }));
    });

    app.get('*', (req, res, next) => {
      const pth = req.path || '';
      if (pth.startsWith('/api') || pth.startsWith('/auth') || pth.startsWith('/upload') || pth === '/me') return next();
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }
} catch (e) {
  console.warn('Static frontend not enabled:', e?.message);
}

app.listen(PORT, () => console.log('API listening on', PORT));
