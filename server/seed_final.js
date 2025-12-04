const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'fusion.db');
const db = new sqlite3.Database(DB_FILE);

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function ensureSchema() {
  await runSql(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT,
    plan_status TEXT,
    condominium_id INTEGER
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    full_name TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS condominiums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    areas TEXT,
    invite_code TEXT UNIQUE
  )`);
}

async function seedDatabase() {
  try {
    console.log('Iniciando seed básico (UTF-8)...');
    await ensureSchema();

    const hashed = bcrypt.hashSync('123456', 10);

    // Condomínio padrão
    await runSql(`INSERT OR IGNORE INTO condominiums (id,name,areas,invite_code) VALUES (1,?,?,?)`, [
      'Condomínio Fusion', JSON.stringify(['Academia','Piscina']), 'CONDO-TEST'
    ]);

    // Admin
    await runSql(`INSERT OR IGNORE INTO users (email,password_hash,user_type,plan_status) VALUES (?,?,?,?)`, [
      'admin@fusion.com', hashed, 'admin', 'active'
    ]);
    const admin = await new Promise((resolve, reject) => db.get(`SELECT id FROM users WHERE email=?`, ['admin@fusion.com'], (e,r)=> e?reject(e):resolve(r)));
    if (admin?.id) await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role) VALUES (?,?,?)`, [admin.id, 'Administrador Fusion','admin']);

    // Instrutor
    await runSql(`INSERT OR IGNORE INTO users (email,password_hash,user_type,plan_status,condominium_id) VALUES (?,?,?,?,1)`, [
      'instrutor@fusion.com', hashed, 'instructor', 'active'
    ]);
    const inst = await new Promise((resolve, reject) => db.get(`SELECT id FROM users WHERE email=?`, ['instrutor@fusion.com'], (e,r)=> e?reject(e):resolve(r)));
    if (inst?.id) await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role) VALUES (?,?,?)`, [inst.id, 'Instrutor Fusion','instrutor']);

    // Aluno
    await runSql(`INSERT OR IGNORE INTO users (email,password_hash,user_type,plan_status,condominium_id) VALUES (?,?,?,?,1)`, [
      'aluno@fusion.com', hashed, 'student', 'active'
    ]);
    const alu = await new Promise((resolve, reject) => db.get(`SELECT id FROM users WHERE email=?`, ['aluno@fusion.com'], (e,r)=> e?reject(e):resolve(r)));
    if (alu?.id) await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role) VALUES (?,?,?)`, [alu.id, 'Aluno Fusion','aluno']);

    console.log('✓ Seed básico concluído (UTF-8).');
    console.log('Admin: admin@fusion.com / 123456');
    console.log('Instrutor: instrutor@fusion.com / 123456');
    console.log('Aluno: aluno@fusion.com / 123456');
  } catch (e) {
    console.error('Erro durante o seed básico:', e);
  } finally {
    db.close();
  }
}

seedDatabase();

