const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, // Максимум соединений в пуле
    idleTimeoutMillis: 30000, // Таймаут простоя
    connectionTimeoutMillis: 2000, // Таймаут подключения
});

pool.connect((err, client, done) => {
    if (err) {
        console.error("Database connection error:", err.stack);
    } else {
        console.log("Connected to database successfully");
        // Проверка информации о базе
        client.query("SELECT current_database() AS db_name, current_schema() AS schema_name", (err, res) => {
            if (err) {
                console.error("Error fetching database info:", err.stack);
            } else {
                const dbInfo = res.rows[0];
                console.log("Database Information:");
                console.log(`Database Name: ${dbInfo.db_name}`);
                console.log(`Current Schema: ${dbInfo.schema_name}`);

                // Проверка таблиц
                client.query(
                    `SELECT table_name 
           FROM information_schema.tables 
           WHERE table_schema = $1`,
                    [dbInfo.schema_name],
                    (err, result) => {
                        if (err) {
                            console.error("Error fetching tables:", err.stack);
                        } else {
                            console.log("Tables in database:");
                            if (result.rows.length > 0) {
                                result.rows.forEach((row, index) => {
                                    console.log(`${index + 1}. ${row.table_name}`);
                                });
                            } else {
                                console.log("No tables found.");
                            }
                        }
                        done(); // Освобождаем соединение
                    }
                );
            }
        });
    }
});

module.exports = pool;
