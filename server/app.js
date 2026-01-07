// /app.js

// 1. Конфигурация dotenv
require("dotenv").config();

// 2. Импорт всех зависимостей
const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); // Socket.IO
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { loginLimiter } = require("./middleware/rateLimiter");
const { getUserRoleInProject } = require("./middleware/checkRole");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const tabsRoutes = require("./routes/tabs");

// 3. Создание экземпляров app и server
const app = express();
const server = http.createServer(app);

// 5. Middleware для Express
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        exposedHeaders: ["Authorization"],
    })
);
app.use("/api/auth/login", loginLimiter);

// 6. Подключение роутов
app.use(tabsRoutes);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/projects/:projectId/permissions", require("./routes/permissions"));

// 7. НАСТРОЙКА SWAGGER
//      1. Опции для swagger-jsdoc
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
//      2. Генерируем спецификацию на основе опций
const swaggerSpec = swaggerJsdoc(swaggerOptions);
//      3. Создаем новый роут для нашей документации
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 9. Экспорт
module.exports = { app, server };
require("./realtime/hocuspocus");
