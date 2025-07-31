const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET;

class AuthService {
    async register(userData) {
        const { username, email, password } = userData;

        if (!username || !email || !password) {
            const error = new Error("Username, email, and password are required");
            error.statusCode = 400;
            throw error;
        }

        // Проверка на существующего пользователя
        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
            const error = new Error("Username already exists");
            error.statusCode = 409; // 409 Conflict
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return userRepository.create({ username, email, hashedPassword });
    }

    async login(credentials) {
        const { username, password } = credentials;

        const user = await userRepository.findByUsername(username);
        if (!user) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401; // 401 Unauthorized
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        const payload = {
            id: user.id,
            username: user.username,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        return { token };
    }

    async getUserInfo(userId) {
        return userRepository.findById(userId);
    }
}

module.exports = new AuthService();
