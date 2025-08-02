const request = require("supertest");
const { app } = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

describe("Projects API", () => {
    let testToken;
    let testUser;

    // Хуки, которые выполняются до и после тестов
    beforeEach(async () => {
        const userResult = await pool.query("INSERT INTO users (username, password, email) VALUES ('testuser', 'pw', 'test@test.com') RETURNING *");
        testUser = userResult.rows[0];

        // 2. Генерируем для него токен с правильным ID
        testToken = jwt.sign({ id: testUser.id, username: testUser.username }, process.env.JWT_SECRET);
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
        // --- ШАГ 1: Подготовка данных СПЕЦИАЛЬНО для этого теста ---
        // Создаем проект, который мы ожидаем получить в ответе
        const projectResult = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            "My Awesome Project",
            "Description for GET",
            testUser.id,
        ]);
        const createdProject = projectResult.rows[0];

        // --- ШАГ 2: Выполнение теста ---
        const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${testToken}`);

        // --- ШАГ 3: Проверка результата ---
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(createdProject.id);
        expect(response.body[0].name).toBe("My Awesome Project");
    });
});
