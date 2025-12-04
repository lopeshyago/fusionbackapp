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

async function ensureAllSchema() {
  // Core entities
  await runSql(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT,
    phone TEXT,
    cpf TEXT,
    plan_status TEXT,
    address TEXT,
    par_q_completed INTEGER DEFAULT 0,
    par_q_has_risk INTEGER DEFAULT 0,
    medical_certificate_url TEXT,
    medical_certificate_required_date TEXT,
    condominium_id INTEGER,
    account_blocked INTEGER DEFAULT 0
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    full_name TEXT,
    role TEXT,
    avatar_url TEXT,
    sex TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS condominiums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    areas TEXT,
    cep TEXT,
    rules TEXT,
    is_active INTEGER DEFAULT 1,
    invite_code TEXT UNIQUE
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    type TEXT,
    target_audience TEXT,
    is_active INTEGER DEFAULT 1,
    valid_until TEXT,
    created_date TEXT
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS weekly_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    condominium_id INTEGER,
    day_of_week TEXT,
    time TEXT,
    activity_name TEXT,
    duration INTEGER,
    capacity INTEGER,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS instructor_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    invited_by INTEGER,
    status TEXT,
    code TEXT,
    expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS parq_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT,
    "order" INTEGER
  )`);
  await runSql(`CREATE TABLE IF NOT EXISTS parq_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    completed_at TEXT,
    expires_at TEXT,
    answers TEXT,
    has_risk_factors INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// Ensure migrations for pre-existing DBs (add missing columns)
async function ensureMigrations() {
  const ensureColumn = async (table, column, ddl) => {
    const cols = await allSql(`PRAGMA table_info(${table})`);
    const names = new Set(cols.map(c => c.name));
    if (!names.has(column)) {
      await runSql(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
  };
  // parq_questions: ensure question_text and "order"
  await ensureColumn('parq_questions', 'question_text', 'question_text TEXT');
  await ensureColumn('parq_questions', 'order', '"order" INTEGER');
  // parq_responses: ensure required columns
  await ensureColumn('parq_responses', 'student_id', 'student_id INTEGER');
  await ensureColumn('parq_responses', 'completed_at', 'completed_at TEXT');
  await ensureColumn('parq_responses', 'expires_at', 'expires_at TEXT');
  await ensureColumn('parq_responses', 'answers', 'answers TEXT');
  await ensureColumn('parq_responses', 'has_risk_factors', 'has_risk_factors INTEGER');
}

async function seedAll() {
  try {
    console.log('Iniciando seed completo...');
    await ensureAllSchema();
    await ensureMigrations();

    const hashed = bcrypt.hashSync('123456', 10);

    // Condomínios
    await runSql(`INSERT OR IGNORE INTO condominiums (id,name,areas,cep,rules,is_active,invite_code) VALUES (1,?,?,?,?,?,?)`, [
      'Condomínio Fusion', JSON.stringify(['Academia','Piscina','Quadra']), '01000-000', 'Use toalha na academia', 1, 'CONDO-TEST'
    ]);
    await runSql(`INSERT OR IGNORE INTO condominiums (id,name,areas,cep,rules,is_active,invite_code) VALUES (2,?,?,?,?,?,?)`, [ // Corrigido
      'Condomínio Alpha', JSON.stringify(['Academia','Sala de Yoga']), '02000-000', 'Horário silencioso após 22h', 1, 'ALPHA-TEST'
    ]);

    // Usuários + perfis
    await runSql(`INSERT OR IGNORE INTO users (id,email,password_hash,user_type,plan_status,condominium_id) VALUES (1,?,?,?,?,1)`, [
      'admin@fusion.com', hashed, 'admin', 'active'
    ]);
    await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role,sex) VALUES (1,?,?,?)`, ['Administrador Fusion','admin','male']);

    await runSql(`INSERT OR IGNORE INTO users (id,email,password_hash,user_type,plan_status,condominium_id,phone,cpf,address) VALUES (2,?,?,?,?,1,?,?,?)`, [
      'instrutor@fusion.com', hashed, 'instructor', 'active', '+55 11 90000-0000', '12345678900', 'Rua A, 100, SÃ£o Paulo'
    ]); // Corrigido
    await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role,sex,avatar_url) VALUES (?,?,?,?,?)`, [2,'Instrutor Fusion','instrutor','male','']);

    await runSql(`INSERT OR IGNORE INTO users (id,email,password_hash,user_type,plan_status,condominium_id,phone,cpf,address) VALUES (3,?,?,?,?,1,?,?,?)`, [
      'aluno@fusion.com', hashed, 'student', 'active', '+55 11 98888-0000', '98765432100', 'Rua B, 200, SÃ£o Paulo'
    ]); // Corrigido
    await runSql(`INSERT OR IGNORE INTO profiles (user_id,full_name,role,sex,avatar_url) VALUES (?,?,?,?,?)`, [3,'Aluno Fusion','aluno','female','']);

    // Avisos
    await runSql(`INSERT OR IGNORE INTO notices (id,title,content,type,target_audience,is_active,created_date) VALUES (1,?,?,?,?,?,?)`, [
      'Bem-vindo à Fusion', 'Fique atento às novidades do seu condomínio!', 'info', 'all', 1, new Date().toISOString() // Corrigido
    ]);
    await runSql(`INSERT OR IGNORE INTO notices (id,title,content,type,target_audience,is_active,created_date) VALUES (2,?,?,?,?,?,?)`, [
      'Manutenção', 'Academia em manutenção na sexta-feira', 'warning', 'all', 1, new Date().toISOString() // Corrigido
    ]);

    // Grade horária
    await runSql(`INSERT OR IGNORE INTO weekly_schedules (id,user_id,condominium_id,day_of_week,time,activity_name,duration,capacity,color) VALUES (1,1,1,'Segunda','08:00','Funcional',60,15,'bg-orange-500')`);
    await runSql(`INSERT OR IGNORE INTO weekly_schedules (id,user_id,condominium_id,day_of_week,time,activity_name,duration,capacity,color) VALUES (2,1,1,'Quarta','19:00','HIIT',45,12,'bg-green-500')`);

    // Convite instrutor
    const expires = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    await runSql(`INSERT OR IGNORE INTO instructor_invites (id,email,invited_by,status,code,expires_at) VALUES (1,?,?,?, ?, ?)`, [
      'novo_instrutor@exemplo.com', 1, 'pending', 'FUSION-INST-TEST', expires
    ]);

    // PAR-Q perguntas
    const pq = [
      'Alguma vez um médico já disse que você possui um problema cardíaco?', // Corrigido
      'Sente dor no peito quando pratica atividade física?', // Corrigido
      'Perde o equilíbrio por tontura com frequência?', // Corrigido
      'Possui algum problema ósseo ou articular?', // Corrigido
      'Toma medicação para pressão arterial ou coração?' // Corrigido
    ];
    for (let i = 0; i < pq.length; i++) {
      await runSql(`INSERT OR IGNORE INTO parq_questions (id,question_text,"order") VALUES (?,?,?)`, [i+1, pq[i], i+1]);
    }

    // Exemplo de resposta PAR-Q do aluno (sem risco)
    const answers = pq.map((q, i) => ({ question_text: q, answer: false }));
    await runSql(`INSERT OR IGNORE INTO parq_responses (id,student_id,completed_at,expires_at,answers,has_risk_factors) VALUES (1,?,?,?, ?, 0)`, [
      3, new Date().toISOString(), new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0], JSON.stringify(answers)
    ]);
    await runSql(`UPDATE users SET par_q_completed=1, par_q_has_risk=0 WHERE id=3`);

    console.log('✓ Seed completo concluído.'); // Corrigido
    console.log('Acessos:');
    console.log('Admin: admin@fusion.com / 123456');
    console.log('Instrutor: instrutor@fusion.com / 123456');
    console.log('Aluno: aluno@fusion.com / 123456');
    console.log('Condomínio: invite_code=CONDO-TEST'); // Corrigido
    console.log('Convite Instrutor: FUSION-INST-TEST');
  } catch (e) {
    console.error('Erro durante seed completo', e);
  } finally {
    db.close();
  }
}

seedAll();
