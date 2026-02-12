const { Pool } = require("pg");
require("dotenv").config();

const isTestEnvironment = process.env.NODE_ENV === "test";
const databaseName = isTestEnvironment ? process.env.DB_TEST_DATABASE : process.env.DB_DATABASE;

// console.log(`Node environment: ${process.env.NODE_ENV}`);
// console.log(`Connecting to database: ${databaseName}`);

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
          }
        : {
              host: process.env.DB_HOST || "dpg-d66rmc248b3s73curktg-a",
              user: process.env.DB_USER || "backend_db_user",
              password: process.env.DB_PASSWORD || "",
              database: process.env.DB_DATABASE || "diplom_db_46vh",
              port: process.env.DB_PORT || 5432,
          },
);

pool.on("error", (err, client) => {
    console.error("!!! UNEXPECTED ERROR ON IDLE CLIENT !!!", err);
    process.exit(-1);
});

// console.log("Database pool configured.");

module.exports = pool;
