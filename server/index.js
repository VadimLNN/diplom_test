require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const compression = require("compression");
const pool = require("./config/database");
const passport = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const documentRoutes = require("./routes/documents");
const logger = require("./utils/logger");
const cors = require("cors"); // Добавлен импорт cors
const Y = require("yjs");
const { encodeStateAsUpdate, applyUpdate } = require("yjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

app.use(compression()); // Сжатие Gzip
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
); // Используем импортированный cors
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);

const docs = new Map();

io.on("connection", (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on("joinDocument", (documentId) => {
        const room = `document_${documentId}`;
        logger.info(`${socket.id} joined document: ${room}`);
        let ydoc = docs.get(room);
        if (!ydoc) {
            ydoc = new Y.Doc();
            docs.set(room, ydoc);
            logger.info(`Created new Y.Doc for ${room}`);
        }

        const state = encodeStateAsUpdate(ydoc);
        socket.emit("documentSync", Array.from(state));

        socket.on("documentUpdate", (update) => {
            try {
                const uintUpdate = new Uint8Array(update);
                applyUpdate(ydoc, uintUpdate);
                logger.info(`Applied update to ${room}`);
                socket.broadcast.to(room).emit("documentUpdate", update);
            } catch (error) {
                logger.error(`Error applying update to ${room}:`, error);
            }
        });

        socket.on("disconnect", () => {
            logger.info(`WebSocket client disconnected: ${socket.id}`);
            if (io.sockets.adapter.rooms.get(room)?.size === 0) {
                docs.delete(room);
                ydoc.destroy();
                logger.info(`Destroyed Y.Doc for ${room}`);
            }
        });

        socket.join(room);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    server.close(() => process.exit(1));
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    server.close(() => process.exit(1));
});
