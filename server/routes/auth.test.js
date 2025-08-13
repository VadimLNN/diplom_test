const request = require("supertest");
const { app } = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

describe("Auth API (/api/auth)", () => {
    // beforeEach будет создавать "чистую" базу перед каждым тестом
    beforeEach(async () => {
        // Очищаем только пользователей, так как другие таблицы здесь не нужны
        await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    });

    // --- ТЕСТЫ ДЛЯ РЕГИСТРАЦИИ ---
    describe("POST /register", () => {
        const validUserData = {
            username: "newuser",
            password: "password123",
            email: "newuser@test.com",
        };

        test("should register a new user with valid data", async () => {
            const response = await request(app).post("/api/auth/register").send(validUserData);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.username).toBe("newuser");
            // Убеждаемся, что пароль НЕ возвращается
            expect(response.body).not.toHaveProperty("password");

            // Проверяем, что пользователь действительно в базе
            const dbCheck = await pool.query("SELECT * FROM users WHERE username = 'newuser'");
            expect(dbCheck.rowCount).toBe(1);
        });

        test("should return 409 Conflict if username already exists", async () => {
            // Сначала создаем пользователя
            await request(app).post("/api/auth/register").send(validUserData);

            // Потом пытаемся создать его снова
            const response = await request(app).post("/api/auth/register").send(validUserData);

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toContain("already exists");
        });

        test("should return 400 Bad Request if data is incomplete", async () => {
            const invalidUserData = { username: "baduser" }; // Нет email и пароля

            const response = await request(app).post("/api/auth/register").send(invalidUserData);

            expect(response.body).toHaveProperty("errors");
            // Мы ожидаем две ошибки: одну для email, одну для пароля.
            expect(response.body.errors.length).toBeGreaterThanOrEqual(2);

            // Проверим, что сообщения об ошибках присутствуют
            const errorMessages = response.body.errors.map((e) => e.msg);
            expect(errorMessages).toContain("Please enter a valid email");
            expect(errorMessages).toContain("Password must be at least 6 characters long");
        });
    });

    // --- ТЕСТЫ ДЛЯ ВХОДА ---
    describe("POST /login", () => {
        // Подготовим пользователя для входа
        beforeEach(async () => {
            await request(app).post("/api/auth/register").send({
                username: "loginuser",
                password: "password123",
                email: "login@test.com",
            });
        });

        test("should return a JWT token for valid credentials", async () => {
            const response = await request(app).post("/api/auth/login").send({ username: "loginuser", password: "password123" });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("token");

            // Проверим, что токен валидный
            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
            expect(decoded).toHaveProperty("id");
            expect(decoded.username).toBe("loginuser");
        });

        test("should return 401 Unauthorized for incorrect password", async () => {
            const response = await request(app).post("/api/auth/login").send({ username: "loginuser", password: "wrongpassword" });

            expect(response.statusCode).toBe(401);
        });
    });

    // --- ТЕСТ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ---
    describe("GET /user", () => {
        let testToken;

        beforeEach(async () => {
            const registerResponse = await request(app).post("/api/auth/register").send({
                username: "testuser",
                password: "password123",
                email: "test@test.com",
            });

            const loginResponse = await request(app).post("/api/auth/login").send({
                username: "testuser",
                password: "password123",
            });
            testToken = loginResponse.body.token;
        });

        test("should return user data for a valid token", async () => {
            const response = await request(app).get("/api/auth/user").set("Authorization", `Bearer ${testToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.username).toBe("testuser");
            expect(response.body).not.toHaveProperty("password");
        });

        test("should return 401 Unauthorized if no token is provided", async () => {
            const response = await request(app).get("/api/auth/user");

            expect(response.statusCode).toBe(401);
        });
    });

    // --- ТЕСТ ДЛЯ СМЕНЫ ПАРОЛЯ ---
    describe("PUT /api/auth/change-password", () => {
        let testToken;
        const userData = {
            username: "changepwuser",
            password: "oldPassword123",
            email: "changepw@test.com",
        };

        // Перед каждым тестом создаем пользователя и получаем токен
        beforeEach(async () => {
            await request(app).post("/api/auth/register").send(userData);
            const loginResponse = await request(app).post("/api/auth/login").send({
                username: userData.username,
                password: userData.password,
            });
            testToken = loginResponse.body.token;
        });

        test("should successfully change the password with valid data", async () => {
            const response = await request(app).put("/api/auth/change-password").set("Authorization", `Bearer ${testToken}`).send({
                currentPassword: "oldPassword123",
                newPassword: "newPassword456",
            });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Password updated successfully.");

            // Проверка: пытаемся залогиниться со старым паролем (должно быть нельзя)
            const oldPwResponse = await request(app).post("/api/auth/login").send({
                username: userData.username,
                password: "oldPassword123",
            });
            expect(oldPwResponse.statusCode).toBe(401);

            // Проверка: пытаемся залогиниться с новым паролем (должно быть можно)
            const newPwResponse = await request(app).post("/api/auth/login").send({
                username: userData.username,
                password: "newPassword456",
            });
            expect(newPwResponse.statusCode).toBe(200);
            expect(newPwResponse.body).toHaveProperty("token");
        });

        test("should return 401 if current password is incorrect", async () => {
            const response = await request(app).put("/api/auth/change-password").set("Authorization", `Bearer ${testToken}`).send({
                currentPassword: "wrongOldPassword",
                newPassword: "newPassword456",
            });

            expect(response.statusCode).toBe(401);
        });

        test("should return 400 if new password is too short", async () => {
            const response = await request(app).put("/api/auth/change-password").set("Authorization", `Bearer ${testToken}`).send({
                currentPassword: "oldPassword123",
                newPassword: "123", // Слишком короткий
            });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors[0].msg).toContain("at least 6 characters");
        });
    });

    // --- ТЕСТ ДЛЯ УДАЛЕНИЯ АККАУНТА ---
    describe("DELETE /api/auth/delete-account", () => {
        let testToken;
        let userId;
        const userData = {
            username: "deleteuser",
            password: "password123",
            email: "delete@test.com",
        };

        beforeEach(async () => {
            const registerResponse = await request(app).post("/api/auth/register").send(userData);
            userId = registerResponse.body.id;

            const loginResponse = await request(app).post("/api/auth/login").send({
                username: userData.username,
                password: userData.password,
            });
            testToken = loginResponse.body.token;
        });

        test("should successfully delete the account with correct password confirmation", async () => {
            const response = await request(app)
                .delete("/api/auth/delete-account")
                .set("Authorization", `Bearer ${testToken}`)
                .send({ password: "password123" });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Account deleted successfully.");

            // Проверяем, что пользователь действительно удален из базы
            const dbCheck = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
            expect(dbCheck.rowCount).toBe(0);
        });

        test("should return 401 if password confirmation is incorrect", async () => {
            const response = await request(app)
                .delete("/api/auth/delete-account")
                .set("Authorization", `Bearer ${testToken}`)
                .send({ password: "wrongpassword" });

            expect(response.statusCode).toBe(401);

            // Проверяем, что пользователь НЕ был удален
            const dbCheck = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
            expect(dbCheck.rowCount).toBe(1);
        });
    });
});
