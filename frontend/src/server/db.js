// Підключення до MySQL. Контейнер MySQL стартує довше за застосунок,
// тому пробуємо підключитись кілька разів, перш ніж здатись.
const mysql = require('mysql2/promise');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createDb(config, { retries = 30, delayMs = 2000 } = {}) {
  const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 5,
  });

  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.log(`MySQL ще не готовий (спроба ${attempt}/${retries}): ${err.code || err.message}`);
      await sleep(delayMs);
    }
  }

  // Найпростіша "міграція": створити таблицю, якщо її ще немає
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('MySQL підключено, таблиця notes готова');

  return {
    async ping() {
      await pool.query('SELECT 1');
    },

    async listNotes() {
      const [rows] = await pool.query(
        'SELECT id, text, created_at FROM notes ORDER BY id DESC LIMIT 50'
      );
      return rows;
    },

    async addNote(text) {
      // "?" — плейсхолдер: захищає від SQL-ін'єкцій
      const [result] = await pool.execute('INSERT INTO notes (text) VALUES (?)', [text]);
      return { id: result.insertId, text };
    },

    close() {
      return pool.end();
    },
  };
}

module.exports = { createDb };
