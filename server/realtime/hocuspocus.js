const { Server } = require("@hocuspocus/server");
const jwt = require("jsonwebtoken");
const db = require("../db");

const HOCO_PORT = process.env.HOCO_PORT || 1234;
const JWT_SECRET = process.env.JWT_SECRET;

/* ======================================================
   Utils
====================================================== */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.error("[JWT] verify failed:", err.message);
        return null;
    }
}

/* ======================================================
   Hocuspocus Server
====================================================== */
const server = new Server({
    port: HOCO_PORT,

    /* ===============================
       AUTH — ВЫЗЫВАЕТСЯ ПЕРЕД CONNECT
    =============================== */
    async onAuthenticate({ token }) {
        console.log("[onAuthenticate] token =", token);

        if (!token) {
            throw new Error("No token");
        }

        const payload = verifyToken(token);
        if (!payload) {
            throw new Error("Invalid token");
        }

        // Просто подтверждаем, КТО это
        return {
            userId: payload.id,
            username: payload.username,
        };
    },

    /* ===============================
       CONNECT — ПОСЛЕ AUTH
    =============================== */
    async onConnect({ documentName }) {
        console.log("🟢 CONNECT document =", documentName);
        const userId = context.user?.userId;

        if (!userId) {
            throw new Error("Unauthenticated");
        }

        const res = await db.query(
            `
            SELECT pp.role
            FROM tabs t
            JOIN project_permissions pp
            ON pp.project_id = t.project_id
            WHERE t.id = $1
            AND pp.user_id = $2
        `,
            [documentName, userId]
        );

        if (res.rowCount === 0) {
            throw new Error("Access denied");
        }

        context.role = res.rows[0].role;

        console.log(`🟢 ACCESS GRANTED user=${userId} tab=${documentName} role=${context.role}`);
    },

    /* ===============================
       WRITE GUARD
    =============================== */
    onChange({ context }) {
        if (context.role === "viewer") {
            throw new Error("Read-only");
        }
    },

    /* ===============================
       OPTIONAL DEBUG
    =============================== */
    onDisconnect({ context }) {
        if (context?.user) {
            console.log(`🔴 DISCONNECT user=${context.user.id}`);
        }
    },
});

/* ======================================================
   START
====================================================== */
server.listen();
