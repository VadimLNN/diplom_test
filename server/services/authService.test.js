const authService = require("./authService");
const userRepository = require("../repositories/userRepository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Мокаем (подменяем) весь модуль userRepository
jest.mock("../repositories/userRepository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

// describe - это группа тестов для одного модуля
describe("AuthService", () => {
    // Очищаем все моки перед каждым тестом, чтобы тесты не влияли друг на друга
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // test (или it) - это один конкретный тест-кейс
    test("login should return a token for valid credentials", async () => {
        // 1. Arrange (Подготовка)
        const mockUser = {
            id: 1,
            username: "testuser",
            password: "hashedpassword",
        };
        const mockToken = "mock-jwt-token";

        // Настраиваем поведение моков
        userRepository.findByUsername.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true); // Пароли совпадают
        jwt.sign.mockReturnValue(mockToken);

        // 2. Act (Действие)
        const result = await authService.login({ username: "testuser", password: "password123" });

        // 3. Assert (Проверка)
        expect(userRepository.findByUsername).toHaveBeenCalledWith("testuser");
        expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword");
        expect(result).toHaveProperty("token");
        expect(result.token).toBe(mockToken);
    });

    test("login should throw an error for invalid credentials", async () => {
        // Arrange
        userRepository.findByUsername.mockResolvedValue(null); // Пользователь не найден

        // Act & Assert
        // Проверяем, что вызов функции приведет к ошибке
        await expect(authService.login({ username: "wronguser", password: "password123" })).rejects.toThrow("Invalid credentials");
    });
});
