// 1. Конфигурация dotenv ДОЛЖНА БЫТЬ САМОЙ ПЕРВОЙ
require("dotenv").config();

// 2. Импорт всех зависимостей
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { loginLimiter } = require("./middleware/rateLimiter");

// 3. Создание экземпляров app и server
const app = express();
const server = http.createServer(app);

// 4. Конфигурация Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// 5. Подключение всех middleware для Express
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        exposedHeaders: ["Authorization"],
    })
);
app.use("/api/auth/login", loginLimiter);

// 6. Подключение всех роутов
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/projects/:projectId/permissions", require("./routes/permissions"));

// 7. Логика для WebSocket соединений
io.on("connection", (socket) => {
    console.log("✅ User connected via WebSocket:", socket.id);

    socket.on("join_document", (documentId) => {
        socket.join(documentId);
        console.log(`User ${socket.id} joined room for document ${documentId}`);
    });

    socket.on("document_change", (data) => {
        const { documentId, newContent } = data;
        socket.to(documentId).emit("receive_document_change", newContent);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// 8. Экспортируем 'app' для тестов и 'server' для запуска
module.exports = { app, server };
