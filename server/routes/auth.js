const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware"); // <-- Импортируем middleware

const JWT_SECRET = process.env.JWT_SECRET;
router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;
    try {
        if (!username || !password || !email) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
            [username, hashedPassword, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Username or email already exists." });
        }
        console.error("Register error:", error.stack);
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const payload = {
            id: user.id,
            username: user.username,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ token });
    } catch (error) {
        console.error("Login error:", error.stack);
        res.status(500).json({ error: "Login failed" });
    }
});

router.get("/user", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Get user error:", error.stack);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

module.exports = router;
