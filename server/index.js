// server.js

const express = require("express");
const http = require("http"); // 1. Импортируем встроенный модуль http
const { Server } = require("socket.io"); // 2. Импортируем Server из socket.io
const cors = require("cors");
const passport = require("./config/passport");

const app = express();
const server = http.createServer(app); // 3. Создаем HTTP сервер на основе Express приложения

// 4. Настраиваем CORS для Socket.IO (отдельно от Express)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Адрес вашего React-приложения
        methods: ["GET", "POST"],
    },
});

// --- Ваша текущая конфигурация Express остается без изменений ---
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        exposedHeaders: ["Authorization"],
    })
);
app.use(passport.initialize());

// --- Ваши роуты остаются без изменений ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/documents", require("./routes/documents"));
// Добавляем роуты для приглашений (код для них ниже)
app.use("/api/projects/:projectId/permissions", require("./routes/permissions"));

// --- 5. Логика обработки WebSocket соединений ---
io.on("connection", (socket) => {
    console.log("✅ User connected via WebSocket:", socket.id);

    // Событие: пользователь открыл документ и готов к редактированию
    socket.on("join_document", (documentId) => {
        socket.join(documentId);
        console.log(`User ${socket.id} joined room for document ${documentId}`);
    });

    // Событие: пользователь изменил контент документа
    socket.on("document_change", (data) => {
        const { documentId, newContent } = data;
        // Отправляем изменения всем в "комнате" этого документа, КРОМЕ отправителя
        socket.to(documentId).emit("receive_document_change", newContent);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// --- 6. Запускаем сервер ---
const PORT = process.env.PORT || 5000;
// ВАЖНО: Теперь мы слушаем `server`, а не `app`
server.listen(PORT, () => {
    console.log(`🚀 Server with WebSocket support running on port ${PORT}`);
});
