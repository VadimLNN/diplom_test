const request = require("supertest");
const express = require("express");
const { app } = require("../app");
const pool = require("../db");
const projectsRouter = require("./projects");
const jwt = require("jsonwebtoken");

// Создаем "игрушечное" Express-приложение для тестов
const app = express();
app.use(express.json());

describe("Projects API", () => {
    let testToken;

    // Хуки, которые выполняются до и после тестов
    beforeAll(async () => {
        // Перед всеми тестами чистим и заполняем таблицы
        await pool.query("DELETE FROM projects");
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (1, 'testuser', 'hashed', 'test@test.com') ON CONFLICT (id) DO NOTHING"
        );
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (1, 'testuser', 'hashed', 'test@test.com') ON CONFLICT (id) DO UPDATE SET username = 'testuser'"
        );
        testToken = jwt.sign({ id: 1, username: "testuser" }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        // После всех тестов закрываем соединение с базой
        await pool.end();
    });

    test("POST /api/projects - should create a new project", async () => {
        const newProject = { name: "Test Project", description: "A project for testing" };

        const response = await request(app).post("/api/projects").set("Authorization", `Bearer ${testToken}`).send(newProject);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Test Project");

        // Проверяем, что запись действительно появилась в базе
        const dbResult = await pool.query("SELECT * FROM projects WHERE id = $1", [response.body.id]);
        expect(dbResult.rowCount).toBe(1);
    });

    test("GET /api/projects - should return a list of projects", async () => {
        const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${testToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1); // Должен быть один проект, созданный в предыдущем тесте
        expect(response.body[0].name).toBe("Test Project");
    });
});
