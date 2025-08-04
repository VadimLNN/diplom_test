const request = require("supertest");
const { app } = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

describe("Documents API", () => {
    // Переменные для хранения токенов и тестовых данных
    let ownerToken, editorToken, viewerToken, strangerToken;
    let testProject;
    let testDocument;

    // beforeEach создает "чистый мир" перед каждым тестом
    beforeEach(async () => {
        // 1. Создаем пользователей
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (1, 'owner', 'pw', 'owner@test.com'), (2, 'editor', 'pw', 'editor@test.com'), (3, 'viewer', 'pw', 'viewer@test.com'), (4, 'stranger', 'pw', 'stranger@test.com') ON CONFLICT (id) DO NOTHING"
        );

        // 2. Генерируем токены
        ownerToken = jwt.sign({ id: 1, username: "owner" }, process.env.JWT_SECRET);
        editorToken = jwt.sign({ id: 2, username: "editor" }, process.env.JWT_SECRET);
        viewerToken = jwt.sign({ id: 3, username: "viewer" }, process.env.JWT_SECRET);
        strangerToken = jwt.sign({ id: 4, username: "stranger" }, process.env.JWT_SECRET);

        // 3. Создаем проект от имени Владельца
        const projectResult = await pool.query("INSERT INTO projects (name, owner_id) VALUES ($1, $2) RETURNING *", ["Test Project", 1]);
        testProject = projectResult.rows[0];

        // 4. Приглашаем Редактора и Наблюдателя
        // Приглашаем Редактора (id=2)
        await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, $3)", [testProject.id, 2, "editor"]);
        // Приглашаем Наблюдателя (id=3)
        await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, $3)", [testProject.id, 3, "viewer"]);

        // 5. Создаем один документ в этом проекте
        const docResult = await pool.query("INSERT INTO documents (project_id, title, content, owner_id) VALUES ($1, $2, $3, $4) RETURNING *", [
            testProject.id,
            "Test Document",
            "Initial content",
            1,
        ]);
        testDocument = docResult.rows[0];
    });

    // --- ТЕСТЫ ---

    describe("GET /api/documents/project/:projectId", () => {
        test("should return documents for any project member (owner, editor, viewer)", async () => {
            for (const token of [ownerToken, editorToken, viewerToken]) {
                const response = await request(app).get(`/api/documents/project/${testProject.id}`).set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(response.body[0].title).toBe("Test Document");
            }
        });

        test("should FORBID access for a stranger", async () => {
            const response = await request(app).get(`/api/documents/project/${testProject.id}`).set("Authorization", `Bearer ${strangerToken}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe("POST /api/documents/project/:projectId", () => {
        const newDocData = { title: "New Doc from Test", content: "Content" };

        test("should allow owner to create a document", async () => {
            const response = await request(app)
                .post(`/api/documents/project/${testProject.id}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send(newDocData);

            expect(response.statusCode).toBe(201);
            expect(response.body.title).toBe(newDocData.title);
        });

        test("should allow editor to create a document", async () => {
            const response = await request(app)
                .post(`/api/documents/project/${testProject.id}`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send(newDocData);

            expect(response.statusCode).toBe(201);
        });

        test("should FORBID a viewer from creating a document", async () => {
            const response = await request(app)
                .post(`/api/documents/project/${testProject.id}`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send(newDocData);

            expect(response.statusCode).toBe(403);
        });

        test("should return 400 if title is empty", async () => {
            const response = await request(app)
                .post(`/api/documents/project/${testProject.id}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ title: "", content: "some content" });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].msg).toBe("Title cannot be empty");
        });
    });

    describe("PUT /api/documents/:id", () => {
        const updateData = { content: "Updated content" };

        test("should allow owner and editor to update a document", async () => {
            for (const token of [ownerToken, editorToken]) {
                const response = await request(app).put(`/api/documents/${testDocument.id}`).set("Authorization", `Bearer ${token}`).send(updateData);

                expect(response.statusCode).toBe(200);
                expect(response.body.content).toBe("Updated content");
            }
        });

        test("should FORBID a viewer from updating a document", async () => {
            const response = await request(app)
                .put(`/api/documents/${testDocument.id}`)
                .set("Authorization", `Bearer ${viewerToken}`)
                .send(updateData);

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toContain("permission to edit");
        });

        test("should return 400 if title is updated to be too long", async () => {
            const longTitle = "a".repeat(151);
            const response = await request(app)
                .put(`/api/documents/${testDocument.id}`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ title: longTitle });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].msg).toBe("Title cannot be more than 150 characters");
        });
    });

    describe("DELETE /api/documents/:id", () => {
        test("should allow owner and editor to delete a document", async () => {
            // Тестируем редактора, так как у него те же права на удаление
            const response = await request(app).delete(`/api/documents/${testDocument.id}`).set("Authorization", `Bearer ${editorToken}`);

            expect(response.statusCode).toBe(204);

            // Убеждаемся, что документ действительно удален
            const dbCheck = await pool.query("SELECT * FROM documents WHERE id = $1", [testDocument.id]);
            expect(dbCheck.rowCount).toBe(0);
        });

        test("should FORBID a viewer from deleting a document", async () => {
            const response = await request(app).delete(`/api/documents/${testDocument.id}`).set("Authorization", `Bearer ${viewerToken}`);

            expect(response.statusCode).toBe(403);

            // Убеждаемся, что документ НЕ был удален
            const dbCheck = await pool.query("SELECT * FROM documents WHERE id = $1", [testDocument.id]);
            expect(dbCheck.rowCount).toBe(1);
        });
    });
});
