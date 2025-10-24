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
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Inserir usuário admin
    const adminResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO users (email, password_hash, user_type, full_name, plan_status)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin@fusion.com', hashedPassword, 'admin', 'Administrador Fusion', 'active'], function(err) {
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

    // Inserir condomínios de exemplo
    const condos = [
      { name: 'Fusion Centro', address: 'Rua Principal, 123 - Centro' },
      { name: 'Fusion Norte', address: 'Av. Norte, 456 - Zona Norte' },
      { name: 'Fusion Sul', address: 'Rua Sul, 789 - Zona Sul' }
    ];

    for (const condo of condos) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO condominiums (name, address)
          VALUES (?, ?)
        `, [condo.name, condo.address], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // Inserir atividades de exemplo
    const activities = [
      { name: 'Musculação', description: 'Treino de força e resistência' },
      { name: 'Pilates', description: 'Exercícios de controle postural' },
      { name: 'Crossfit', description: 'Treino funcional de alta intensidade' },
      { name: 'Yoga', description: 'Prática de relaxamento e flexibilidade' }
    ];

    for (const activity of activities) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO activities (name, description)
          VALUES (?, ?)
        `, [activity.name, activity.description], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    // Inserir perguntas PAR-Q
    const parqQuestions = [
      'Seu médico já disse que você tem problema de coração?',
      'Você sente dor no peito quando pratica atividade física?',
      'No último mês, você sentiu dor no peito quando NÃO estava praticando atividade física?',
      'Você perdeu o equilíbrio devido a tontura ou já perdeu a consciência?',
      'Você tem algum problema ósseo ou articular que poderia piorar com atividade física?',
      'Seu médico atualmente prescreve medicamentos para pressão arterial ou problema de coração?',
      'Você conhece alguma outra razão pela qual não deveria praticar atividade física?'
    ];

    for (const question of parqQuestions) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO parq_questions (question)
          VALUES (?)
        `, [question], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }

    console.log('✓ Seed concluído com sucesso!');
    console.log('');
    console.log('Dados de acesso:');
    console.log('Email: admin@fusion.com');
    console.log('Senha: admin123');
    console.log('Tipo: admin');

  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    db.close();
  }
}

seedDatabase();
