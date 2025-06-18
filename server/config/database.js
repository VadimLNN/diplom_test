const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, // Максимальное число подключений
    idleTimeoutMillis: 30000, // Таймаут простоя
    connectionTimeoutMillis: 2000, // Таймаут подключения
});

module.exports = pool;
