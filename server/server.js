const { app, server } = require("./app");
const PORT = process.env.PORT || 5000;
const HOCO_PORT = process.env.HOCO_PORT;
const hocuspocusServer = require("./realtime/hocuspocus_server");

const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function initDb() {
    const sqlPath = path.join(__dirname, "db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await pool.query(sql);
    console.log("✅ DB initialized");
}

initDb().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server: http://...:${PORT}`);
        console.log(`📚 Swagger: http://...:${PORT}/api-docs`);
    });
});

hocuspocusServer.listen(HOCO_PORT, () => {
    console.log("🔌 Hocuspocus WS: ws:/.../api/collab");
});
