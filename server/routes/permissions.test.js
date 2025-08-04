const request = require("supertest");
const { app } = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

describe("Permissions API (/api/projects/:projectId/permissions)", () => {
    let ownerToken, editorToken, strangerToken;
    let testProject;

    beforeEach(async () => {
        // Создаем пользователей: владелец (1), редактор (2), посторонний (3), еще один юзер для приглашения (4)
        await pool.query(
            "INSERT INTO users (id, username, password, email) VALUES (1, 'owner', 'pw', 'owner@test.com'), (2, 'editor', 'pw', 'editor@test.com'), (3, 'stranger', 'pw', 'stranger@test.com'), (4, 'invitee', 'pw', 'invitee@test.com') ON CONFLICT (id) DO NOTHING"
        );

        ownerToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
        editorToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET);
        strangerToken = jwt.sign({ id: 3 }, process.env.JWT_SECRET);

        // Создаем проект и приглашаем редактора
        const projectResult = await pool.query("INSERT INTO projects (name, owner_id) VALUES ($1, $2) RETURNING *", ["Test Project", 1]);
        testProject = projectResult.rows[0];
        await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, 'editor')", [testProject.id, 2]);
    });

    // --- ТЕСТЫ ---

    describe("POST /", () => {
        const inviteData = { email: "invitee@test.com", role: "viewer" };

        test("should allow the owner to invite a new user", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send(inviteData);

            expect(response.statusCode).toBe(201);
            expect(response.body.user_id).toBe(4); // ID пользователя 'invitee'
            expect(response.body.role).toBe("viewer");
        });

        test("should FORBID an editor from inviting a user", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send(inviteData);

            expect(response.statusCode).toBe(403);
        });

        test("should return 404 if inviting a non-existent user", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: "ghost@test.com", role: "viewer" });

            expect(response.statusCode).toBe(404);
        });

        test("should return 409 if inviting a user who is already a member", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: "editor@test.com", role: "viewer" }); // 'editor' уже в проекте

            expect(response.statusCode).toBe(409); // Conflict
        });

        test("should return 400 for an invalid email", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: "not-an-email", role: "viewer" });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].msg).toBe("Please provide a valid email address");
        });

        test("should return 400 for an invalid role", async () => {
            const response = await request(app)
                .post(`/api/projects/${testProject.id}/permissions`)
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: "invitee@test.com", role: "admin" }); // 'admin' - невалидная роль

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].msg).toBe("Role must be either 'editor' or 'viewer'");
        });
    });

    describe("GET /", () => {
        test("should allow a project member to get the list of members", async () => {
            const response = await request(app).get(`/api/projects/${testProject.id}/permissions`).set("Authorization", `Bearer ${editorToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(2); // Владелец + Редактор
            const roles = response.body.map((m) => m.role);
            expect(roles).toContain("owner");
            expect(roles).toContain("editor");
        });

        test("should FORBID a stranger from getting the list of members", async () => {
            const response = await request(app).get(`/api/projects/${testProject.id}/permissions`).set("Authorization", `Bearer ${strangerToken}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe("DELETE /:userId", () => {
        const editorUserId = 2;

        test("should allow the owner to remove a member", async () => {
            const response = await request(app)
                .delete(`/api/projects/${testProject.id}/permissions/${editorUserId}`)
                .set("Authorization", `Bearer ${ownerToken}`);

            expect(response.statusCode).toBe(200);

            // Проверяем, что участник действительно удален
            const members = await pool.query("SELECT * FROM project_permissions WHERE project_id = $1", [testProject.id]);
            expect(members.rowCount).toBe(0);
        });

        test("should FORBID an editor from removing another member", async () => {
            const response = await request(app)
                .delete(`/api/projects/${testProject.id}/permissions/${editorUserId}`)
                .set("Authorization", `Bearer ${editorToken}`);

            expect(response.statusCode).toBe(403);
        });

        test("should FORBID the owner from removing themselves", async () => {
            const ownerUserId = 1;
            const response = await request(app)
                .delete(`/api/projects/${testProject.id}/permissions/${ownerUserId}`)
                .set("Authorization", `Bearer ${ownerToken}`);

            expect(response.statusCode).toBe(400); // Bad Request, т.к. это нелогичное действие
        });
    });
});
