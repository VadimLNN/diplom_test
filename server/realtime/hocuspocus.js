const { Server } = require("@hocuspocus/server");
const jwt = require("jsonwebtoken");
const db = require("../db");

const HOCO_PORT = process.env.HOCO_PORT || 1234;

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

const hocuspocus = new Server({
    port: HOCO_PORT,

    /* ===============================
       AUTH
    =============================== */
    async onAuthenticate({ token }) {
        if (!token) {
            throw new Error("No token provided");
        }

        const payload = verifyToken(token);
        if (!payload) {
            throw new Error("Invalid token");
        }

        return {
            userId: payload.id,
        };
    },

    /* ===============================
       PERMISSIONS
    =============================== */
    async onConnect({ context, documentName }) {
        const tabId = documentName; // tabId == documentName
        const userId = context.userId;

        const result = await db.query(
            `
            SELECT pm.role
            FROM tabs t
            JOIN project_members pm ON pm.project_id = t.project_id
            WHERE t.id = $1 AND pm.user_id = $2
            `,
            [tabId, userId]
        );

        if (result.rowCount === 0) {
            throw new Error("Access denied");
        }

        context.role = result.rows[0].role;

        console.log(`🟢 YJS CONNECT user=${userId} tab=${tabId} role=${context.role}`);
    },

    /* ===============================
       WRITE GUARD
    =============================== */
    onChange({ context }) {
        if (context.role === "viewer") {
            throw new Error("Read-only access");
        }
    },
});

hocuspocus.listen();
