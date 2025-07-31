const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'multilogistics',
  port: process.env.DB_PORT || 5432, // default PostgreSQL port
});

db.connect()
  .then(() => console.log('Connected to PostgreSQL database.'))
  .catch((err) => console.error('Database connection failed:', err.stack));

module.exports = db;
