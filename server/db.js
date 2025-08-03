const { Pool } = require("pg");
require("dotenv").config();

const isTestEnvironment = process.env.NODE_ENV === "test";
const databaseName = isTestEnvironment ? process.env.DB_TEST_DATABASE : process.env.DB_DATABASE;

// console.log(`Node environment: ${process.env.NODE_ENV}`);
// console.log(`Connecting to database: ${databaseName}`);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: databaseName, // <-- Используем динамическое имя
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, // Максимум соединений в пуле
    idleTimeoutMillis: 30000, // Таймаут простоя
    connectionTimeoutMillis: 2000, // Таймаут подключения
});

pool.on("error", (err, client) => {
    console.error("!!! UNEXPECTED ERROR ON IDLE CLIENT !!!", err);
    process.exit(-1);
});

// console.log("Database pool configured.");

module.exports = pool;
