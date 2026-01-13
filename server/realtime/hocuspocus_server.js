// /realtime/hocuspocus_server.js
const { Hocuspocus } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const expressWs = require("express-ws");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const createHocuspocus = (app) => {
    const hocuspocus = new Hocuspocus({
        extensions: [
            new Database({
                fetch: async ({ documentName }) => {
                    // documentName = 'tab.abc-123-uuid'
                    try {
                        const result = await pool.query("SELECT ydoc_data FROM yjs_documents WHERE ydoc_document_name = $1", [documentName]);
                        return result.rows[0]?.ydoc_data || null;
                    } catch (err) {
                        console.error("DB fetch error:", err);
                        return null;
                    }
                },
                store: async ({ documentName, state }) => {
                    try {
                        await pool.query(
                            `INSERT INTO yjs_documents (ydoc_document_name, ydoc_data, created_at, updated_at)
               VALUES ($1, $2, NOW(), NOW())
               ON CONFLICT (ydoc_document_name) DO UPDATE SET ydoc_data = $2, updated_at = NOW()`,
                            [documentName, Buffer.from(state)]
                        );
                    } catch (err) {
                        console.error("DB store error:", err);
                    }
                },
            }),
        ],

        async onAuthenticate(data) {
            // const token = data.token;
            // try {
            //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //     data.user = { id: decoded.id, name: decoded.username };
            //     return true;
            // } catch (err) {
            //     return false;
            // }
            return true;
        },

        async onConnect(data) {
            // data.documentName = 'tab.abc-123'
            const tabId = data.documentName.replace("tab.", "");
            console.log(`User ${data.user.id} connected to tab ${tabId}`);
        },
    });

    return hocuspocus;
};
