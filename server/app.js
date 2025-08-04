// 1. Конфигурация dotenv ДОЛЖНА БЫТЬ САМОЙ ПЕРВОЙ
require("dotenv").config();

// 2. Импорт всех зависимостей
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { loginLimiter } = require("./middleware/rateLimiter");
const { getUserRoleInProject } = require("./middleware/checkRole");
const pool = require("./db");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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

// --- MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ SOCKET.IO ---
// Этот middleware будет выполняться для каждого нового подключения
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error: Token not provided."));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token."));
        }
        // Если токен валиден, прикрепляем информацию о пользователе к сокету
        socket.user = { id: decoded.id, username: decoded.username };
        next();
    });
});

// 7. Логика для WebSocket соединений
io.on("connection", (socket) => {
    console.log(`✅ Authenticated user connected via WebSocket: ${socket.user.username} (ID: ${socket.user.id})`);

    socket.on("join_document", async (documentId) => {
        try {
            // 1. Находим, какому проекту принадлежит документ
            const docResult = await pool.query("SELECT project_id FROM documents WHERE id = $1", [documentId]);
            if (docResult.rows.length === 0) {
                // Если документа нет, просто ничего не делаем
                console.log(`[Socket] User ${socket.user.id} tried to join non-existent document ${documentId}`);
                return;
            }
            const projectId = docResult.rows[0].project_id;

            // 2. Проверяем, есть ли у пользователя роль в этом проекте
            const role = await getUserRoleInProject(socket.user.id, projectId);

            // 3. Если роль есть (owner, editor, или viewer), то разрешаем подключение
            if (role) {
                socket.join(documentId);
                console.log(`[Socket] User ${socket.user.username} successfully joined room for document ${documentId}`);
            } else {
                // Если роли нет, молча игнорируем запрос. Не нужно отправлять ошибку, чтобы не давать подсказок.
                console.log(`[Socket] FORBIDDEN: User ${socket.user.id} tried to join document ${documentId} without access.`);
            }
        } catch (error) {
            console.error("[Socket] Error in join_document handler:", error);
        }

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

// --- НАСТРОЙКА SWAGGER ---

// 1. Опции для swagger-jsdoc
const swaggerOptions = {
    definition: {
        openapi: "3.0.0", // Версия спецификации OpenAPI
        info: {
            title: "Collaborative Editor API",
            version: "1.0.0",
            description:
                "API документация для проекта коллаборативного редактора. Здесь описаны все эндпоинты для управления пользователями, проектами и документами.",
        },
        // Описываем, как серверы и аутентификация работают
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Указываем, где swagger-jsdoc должен искать комментарии с документацией
    apis: ["./routes/*.js"], // Искать во всех .js файлах внутри папки /routes
};

// 2. Генерируем спецификацию на основе опций
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 3. Создаем новый роут для нашей документации
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 8. Экспортируем 'app' для тестов и 'server' для запуска
module.exports = { app, server };
