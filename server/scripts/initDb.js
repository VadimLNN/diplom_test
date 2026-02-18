const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function init() {
    try {
        const sqlPath = path.join(__dirname, "..", "db.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
        });

        await client.connect();
        console.log("✅ Connected to DB");

        await client.query(sql);
        console.log("✅ Tables created");

        await client.end();
    } catch (err) {
        console.error("❌ DB init error:", err);
        process.exit(1);
    }
}

init();
