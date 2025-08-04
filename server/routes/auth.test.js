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
});
