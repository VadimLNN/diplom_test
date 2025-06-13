const express = require("express");
const { Pool } = require("pg");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Подключение к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Настройка Passport.js
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [jwt_payload.id]);
            if (rows.length > 0) {
                return done(null, rows[0]);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

app.use(passport.initialize());

// Регистрация пользователя
app.post("/register", async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const { rows } = await pool.query("INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email", [
            username,
            hashedPassword,
            email,
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(400).json({ error: "User already exists or invalid data" });
    }
});

// Авторизация пользователя
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        console.log("Generated token:", token);
        res.json({ token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Защищённый маршрут для профиля пользователя
app.get("/user", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ username: req.user.username });
});

// Защищённый маршрут для проектов
app.get("/projects", passport.authenticate("jwt", { session: false }), (req, res) => {
    // Заглушка: возвращаем пример проектов
    const projects = [
        { id: 1, name: "Game Design Doc", description: "Documentation for a new RPG game." },
        { id: 2, name: "UI Redesign", description: "Redesigning the app interface." },
    ];
    res.json(projects);
});

app.listen(5000, () => console.log("Server running on port 5000"));
