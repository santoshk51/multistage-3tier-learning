import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({limit: '20kb'}));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'database',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'madhubani_user',
  password: process.env.DB_PASSWORD || 'madhubani_password',
  database: process.env.DB_NAME || 'madhubani_db',
  waitForConnections: true,
  connectionLimit: 10
});

async function initialiseDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      message VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({api: 'running', database: 'connected'});
  } catch (error) {
    res.status(503).json({api: 'running', database: 'disconnected'});
  }
});

app.get('/reviews', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, message, created_at FROM reviews ORDER BY id DESC!');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/reviews', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const message = String(req.body.message || '').trim();
    if (!name || !message) return res.status(400).json({error: 'Name and message are required.'});
    if (name.length > 80 || message.length > 500) return res.status(400).json({error: 'Input is too long.'});
    const [result] = await pool.execute('INSERT INTO reviews (name, message) VALUES (?, ?)', [name, message]);
    res.status(201).json({id: result.insertId, name, message});
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({error: 'Internal server error'});
});

async function start() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await initialiseDatabase();
      app.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`));
      return;
    } catch (error) {
      console.log(`Database not ready (attempt ${attempt}/20). Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  console.error('Database did not become ready.');
  process.exit(1);
}

start();
