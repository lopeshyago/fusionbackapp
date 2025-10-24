const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'fusion.db');
const db = new sqlite3.Database(DB_FILE);

async function seedDatabase() {
  try {
    console.log('Iniciando seed do banco de dados...');

    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Inserir usuário admin
    const adminResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO users (email, password_hash)
        VALUES (?, ?)
      `, ['admin@fusion.com', hashedPassword], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    if (adminResult.lastID) {
      console.log('✓ Usuário admin criado com ID:', adminResult.lastID);

      // Inserir perfil do admin
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO profiles (user_id, full_name, role)
          VALUES (?, ?, ?)
        `, [adminResult.lastID, 'Administrador Fusion', 'admin'], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // Inserir instrutor
    const instructorResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO users (email, password_hash)
        VALUES (?, ?)
      `, ['instrutor@fusion.com', hashedPassword], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    if (instructorResult.lastID) {
      console.log('✓ Usuário instrutor criado com ID:', instructorResult.lastID);

      // Inserir perfil do instrutor
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO profiles (user_id, full_name, role)
          VALUES (?, ?, ?)
        `, [instructorResult.lastID, 'Instrutor Fusion', 'instrutor'], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // Inserir aluno
    const studentResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO users (email, password_hash)
        VALUES (?, ?)
      `, ['aluno@fusion.com', hashedPassword], function(err) {
        if (err) reject(err);
          else resolve(this);
      });
    });

    if (studentResult.lastID) {
      console.log('✓ Usuário aluno criado com ID:', studentResult.lastID);

      // Inserir perfil do aluno
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO profiles (user_id, full_name, role)
          VALUES (?, ?, ?)
        `, [studentResult.lastID, 'Aluno Fusion', 'aluno'], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    console.log('✓ Seed concluído com sucesso!');
    console.log('');
    console.log('Dados de acesso:');
    console.log('Admin: admin@fusion.com / 123456');
    console.log('Instrutor: instrutor@fusion.com / 123456');
    console.log('Aluno: aluno@fusion.com / 123456');

  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    db.close();
  }
}

seedDatabase();
