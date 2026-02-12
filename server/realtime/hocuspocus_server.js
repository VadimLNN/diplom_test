// /realtime/hocuspocus_server.js
const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const pool = require("../db");

const hocuspocusServer = new Server({
    port: null,
    path: "/api/collab",

    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                const result = await pool.query("SELECT ydoc_data FROM yjs_documents WHERE ydoc_document_name = $1", [documentName]);

                const row = result.rows[0];

                // ⬅️ КРИТИЧНО: если данных нет или они подозрительные
                if (!row || !row.ydoc_data || row.ydoc_data.length < 20) {
                    console.log("📄 Creating new Yjs doc:", documentName);
                    return null;
                }

                return row.ydoc_data;
            },

            store: async ({ documentName, state }) => {
                // ⬅️ КРИТИЧНО: НЕ сохраняем мусор
                if (!state || state.length < 20) {
                    console.warn("⚠️ Skip storing invalid Yjs state:", documentName, state?.length);
                    return;
                }

                await pool.query(
                    `
                    INSERT INTO yjs_documents (ydoc_document_name, ydoc_data, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                    ON CONFLICT (ydoc_document_name)
                    DO UPDATE SET ydoc_data = $2, updated_at = NOW()
                    `,
                    [documentName, Buffer.from(state)],
                );

                console.log("💾 Stored Yjs doc:", documentName, state.length);
            },
        }),
    ],

    onConnect({ documentName }) {
        console.log("🟢 CONNECT", documentName);
    },

    onDisconnect({ documentName }) {
        console.log("🔴 DISCONNECT", documentName);
    },

    onChange({ documentName }) {
        //console.log("✏️ UPDATE in document:", documentName);
    },
});

module.exports = hocuspocusServer;
