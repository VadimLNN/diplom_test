const { WebSocketServer } = require("ws");
const Y = require("yjs");
const { encodeStateAsUpdate, applyUpdate } = require("yjs");

const wss = new WebSocketServer({ port: 1234, host: "0.0.0.0" });
const docs = new Map();

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const docName = url.searchParams.get("docName") || "default";
    console.log(`WebSocket connection established for doc: ${docName}`);

    let ydoc = docs.get(docName);
    if (!ydoc) {
        ydoc = new Y.Doc();
        docs.set(docName, ydoc);
        console.log(`Created new Y.Doc for ${docName}`);
    }

    // Отправляем текущее состояние
    const state = encodeStateAsUpdate(ydoc);
    ws.send(state);

    ws.on("message", (message) => {
        try {
            const update = new Uint8Array(message);
            applyUpdate(ydoc, update);
            console.log(`Applied update to ${docName}`);
            // Рассылаем обновление всем клиентам
            wss.clients.forEach((client) => {
                if (client.readyState === client.OPEN && client !== ws) {
                    client.send(update);
                }
            });
        } catch (error) {
            console.error(`Error applying update to ${docName}:`, error);
        }
    });

    ws.on("close", () => {
        console.log(`Client disconnected from ${docName}`);
        // Очищаем документ, если нет клиентов
        if ([...wss.clients].every((client) => client.readyState !== client.OPEN)) {
            docs.delete(docName);
            ydoc.destroy();
            console.log(`Destroyed Y.Doc for ${docName}`);
        }
    });

    ws.on("error", (error) => {
        console.error(`WebSocket error in ${docName}:`, error);
    });
});

console.log("y-websocket server running on port 1234");
