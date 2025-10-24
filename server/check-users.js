const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'fusion.db');
const db = new sqlite3.Database(DB_FILE);

async function checkUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT u.id, u.email, u.password_hash, p.full_name, p.role FROM users u LEFT JOIN profiles p ON p.user_id = u.id', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function main() {
  try {
    console.log('Verificando usuarios existentes...');
    const existingUsers = await checkUsers();
    console.log('Usuarios encontrados:', existingUsers.length);

    existingUsers.forEach((row, index) => {
      console.log(index + 1 + '. ID: ' + row.id + ', Email: ' + row.email + ', Nome: ' + row.full_name + ', Role: ' + row.role);
      console.log('   Password hash:', row.password_hash ? 'Presente' : 'Ausente');
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    db.close();
  }
}

main();
