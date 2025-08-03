const request = require("supertest");
const { app } = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

describe("Projects API", () => {
    let ownerToken, editorToken, strangerToken;
    let testUser;

    // Хуки, которые выполняются до и после тестов
    beforeEach(async () => {
        // --- ШАГ 1: Создаем всех трех пользователей ---
        await pool.query("INSERT INTO users (id, username, password, email) VALUES (1, 'owner', 'pw', 'owner@test.com') ON CONFLICT (id) DO NOTHING");
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (2, 'editor', 'pw', 'editor@test.com') ON CONFLICT (id) DO NOTHING"
        );
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (3, 'stranger', 'pw', 'stranger@test.com') ON CONFLICT (id) DO NOTHING"
        );

        // --- ШАГ 2: Генерируем для них токены ---
        ownerToken = jwt.sign({ id: 1, username: "owner" }, process.env.JWT_SECRET);
        editorToken = jwt.sign({ id: 2, username: "editor" }, process.env.JWT_SECRET);
        strangerToken = jwt.sign({ id: 3, username: "stranger" }, process.env.JWT_SECRET);

        // --- ШАГ 3: Создаем тестовый проект от имени Владельца (id=1) ---
        const projectResult = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            "Test Project",
            "A project for testing",
            1,
        ]);
        testProject = projectResult.rows[0];

        // --- ШАГ 4: Приглашаем Редактора (id=2) в этот проект ---
        await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, $3)", [testProject.id, 2, "editor"]);
    });

    // create project
    test("POST /api/projects - should create a new project", async () => {
        const newProject = { name: "Test Project", description: "A project for testing" };

        const response = await request(app).post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send(newProject);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Test Project");
        expect(response.body.owner_id).toBe(1); // Проверяем ID владельца

        // Проверяем, что запись действительно появилась в базе
        const dbResult = await pool.query("SELECT * FROM projects WHERE id = $1", [response.body.id]);
        expect(dbResult.rowCount).toBe(1);
    });

    // get all projects
    test("GET /api/projects - should return a list of projects", async () => {
        const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe("Test Project");
    });

    // get one project
    describe("GET /api/projects/:id", () => {
        test("should return a project if user is the owner", async () => {
            const response = await request(app).get(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${ownerToken}`); // <-- Используем токен Владельца

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(testProject.id);
            expect(response.body.name).toBe("Test Project");
        });

        test("should return a project if user is a member", async () => {
            const response = await request(app).get(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${editorToken}`); // <-- Используем токен Редактора

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(testProject.id);
        });

        test("should return 403 Forbidden if user has no access", async () => {
            const response = await request(app).get(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${strangerToken}`); // <-- Используем токен Постороннего

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({ error: "Forbidden: No access to this project." });
        });
    });
});
