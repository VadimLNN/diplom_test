const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const logger = require("../utils/logger");
const passport = require("../middleware/auth");

router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;
    try {
        if (!username || !password || !email) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id, username, email",
            [username, hashedPassword, email]
        );
        if (rows.length === 0) {
            return res.status(400).json({ error: "Username or email already exists" });
        }
        logger.info(`User registered: ${username}`);
        res.status(201).json(rows[0]);
    } catch (error) {
        logger.error("Register error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        logger.info(`User logged in: ${username}`);
        res.json({ token });
    } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/user", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ username: req.user.username });
});

module.exports = router;
