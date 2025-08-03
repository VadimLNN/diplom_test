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
    describe("POST /api/projects", () => {
        test("should create a new project for an authenticated user with valid data", async () => {
            const newProjectData = { name: "My New Creative Project", description: "A detailed description" };

            const response = await request(app)
                .post("/api/projects")
                .set("Authorization", `Bearer ${ownerToken}`) // Любой аутентифицированный пользователь может создать проект
                .send(newProjectData);

            // 1. Проверяем ответ от API
            expect(response.statusCode).toBe(201); // 201 Created
            expect(response.body).toHaveProperty("id");
            expect(response.body.name).toBe("My New Creative Project");
            expect(response.body.owner_id).toBe(1); // ID пользователя из `ownerToken`

            // 2. Проверяем, что запись действительно появилась в базе данных
            const dbCheck = await pool.query("SELECT * FROM projects WHERE id = $1", [response.body.id]);
            expect(dbCheck.rowCount).toBe(1);
            expect(dbCheck.rows[0].name).toBe("My New Creative Project");
        });

        test("should return 401 Unauthorized if no token is provided", async () => {
            const newProjectData = { name: "Unauthorized Project" };

            const response = await request(app).post("/api/projects").send(newProjectData); // <-- Запрос без заголовка Authorization

            expect(response.statusCode).toBe(401);
        });

        test("should return 400 Bad Request if project name is missing", async () => {
            const invalidProjectData = { description: "This project has no name" }; // <-- Отсутствует обязательное поле `name`

            const response = await request(app).post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send(invalidProjectData);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ error: "Project name is required" }); // Или другое сообщение из вашего сервиса
        });

        test("should create a project even if description is missing", async () => {
            const projectWithoutDesc = { name: "Project without description" }; // <-- `description` не является обязательным

            const response = await request(app).post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send(projectWithoutDesc);

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe("Project without description");
            expect(response.body.description).toBeNull(); // Или '', в зависимости от вашей логики и схемы БД
        });
    });

    // get all projects
    describe("GET /api/projects", () => {
        test("should return a list containing projects owned by the user", async () => {
            // В `beforeEach` уже создан один проект для 'owner' (user 1)
            const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${ownerToken}`); // <-- Используем токен Владельца

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe("Test Project");
        });

        test("should return a list containing projects the user is a member of", async () => {
            // `beforeEach` пригласил 'editor' (user 2) в проект 'Test Project'
            const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${editorToken}`); // <-- Используем токен Редактора

            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe(testProject.id); // Убеждаемся, что это тот самый проект
        });

        test("should return an empty array for a user with no projects", async () => {
            const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${strangerToken}`); // <-- Используем токен Постороннего

            expect(response.statusCode).toBe(200);
            // Важно: сервер должен вернуть 200 OK и пустой массив, а не ошибку
            expect(response.body).toEqual([]);
        });

        test("should return all projects, both owned and shared", async () => {
            // --- Подготовка для сложного случая ---
            // Создадим еще один проект, где 'editor' (user 2) является владельцем
            await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3)", [
                "Editors Own Project",
                "A personal project for the editor",
                2,
            ]);

            // --- Тест ---
            // Теперь, когда 'editor' запросит свои проекты, он должен увидеть два:
            // 1. 'Test Project', в который его пригласили.
            // 2. 'Editors Own Project', которым он владеет.
            const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${editorToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(2); // <-- Ключевая проверка

            // Убедимся, что оба проекта присутствуют в ответе
            const projectNames = response.body.map((p) => p.name);
            expect(projectNames).toContain("Test Project");
            expect(projectNames).toContain("Editors Own Project");
        });
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

    // update
    describe("PUT /api/projects/:id", () => {
        const updateData = { name: "Updated Project Name", description: "Updated description" };

        test("should allow the owner to update the project", async () => {
            const response = await request(app)
                .put(`/api/projects/${testProject.id}`)
                .set("Authorization", `Bearer ${ownerToken}`) // <-- Токен Владельца
                .send(updateData);

            // 1. Проверяем успешный ответ
            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe("Updated Project Name");
            expect(response.body.description).toBe("Updated description");

            // 2. Убеждаемся, что данные в БД действительно изменились
            const dbCheck = await pool.query("SELECT * FROM projects WHERE id = $1", [testProject.id]);
            expect(dbCheck.rows[0].name).toBe("Updated Project Name");
        });

        test("should FORBID an editor from updating the project", async () => {
            const response = await request(app)
                .put(`/api/projects/${testProject.id}`)
                .set("Authorization", `Bearer ${editorToken}`) // <-- Токен Редактора
                .send(updateData);

            // Ожидаем ошибку доступа, т.к. только 'owner' может менять проект
            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({ error: "Forbidden: You do not have the required role for this action." });
        });

        test("should FORBID a stranger from updating the project", async () => {
            const response = await request(app)
                .put(`/api/projects/${testProject.id}`)
                .set("Authorization", `Bearer ${strangerToken}`) // <-- Токен Постороннего
                .send(updateData);

            // middleware checkProjectAccess вернет 403, т.к. нет даже базового доступа
            expect(response.statusCode).toBe(403);
        });

        test("should return 400 Bad Request if the name is empty", async () => {
            const invalidUpdateData = { name: "" }; // Пустое имя невалидно

            const response = await request(app)
                .put(`/api/projects/${testProject.id}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send(invalidUpdateData);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ error: "Project name is required" }); // Сообщение из вашего projectService
        });
    });

    // delete
    describe("DELETE /api/projects/:id", () => {
        test("should allow the owner to delete the project", async () => {
            const response = await request(app).delete(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${ownerToken}`); // <-- Токен Владельца

            // 1. Проверяем успешный ответ
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: "Project deleted successfully" });

            // 2. Убеждаемся, что проект ДЕЙСТВИТЕЛЬНО исчез из базы данных
            const dbCheck = await pool.query("SELECT * FROM projects WHERE id = $1", [testProject.id]);
            expect(dbCheck.rowCount).toBe(0);
        });

        test("should FORBID an editor from deleting the project", async () => {
            const response = await request(app).delete(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${editorToken}`); // <-- Токен Редактора

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({ error: "Forbidden: You do not have the required role for this action." });

            // Убеждаемся, что проект НЕ был удален
            const dbCheck = await pool.query("SELECT * FROM projects WHERE id = $1", [testProject.id]);
            expect(dbCheck.rowCount).toBe(1);
        });

        test("should FORBID a stranger from deleting the project", async () => {
            const response = await request(app).delete(`/api/projects/${testProject.id}`).set("Authorization", `Bearer ${strangerToken}`); // <-- Токен Постороннего

            expect(response.statusCode).toBe(403);

            // Убеждаемся, что проект НЕ был удален
            const dbCheck = await pool.query("SELECT * FROM projects WHERE id = $1", [testProject.id]);
            expect(dbCheck.rowCount).toBe(1);
        });

        test("should return 403 when trying to delete a non-existent project as an authorized user", async () => {
            const nonExistentProjectId = 9999;
            const response = await request(app).delete(`/api/projects/${nonExistentProjectId}`).set("Authorization", `Bearer ${ownerToken}`);

            // middleware checkProjectAccess вернет 403, потому что проекта не существует
            // и он не может подтвердить доступ к нему. Это ожидаемое поведение.
            expect(response.statusCode).toBe(403);
        });
    });
});
