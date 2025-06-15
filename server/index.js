require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { Pool } = require("pg");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(
    cors({
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);
app.use(express.json());

// Настройка passport-jwt
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

// Регистрация
app.post("/register", async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await pool.query("INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email", [
            username,
            hashedPassword,
            email,
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Register error:", error);
        res.status(400).json({ error: "Username or email already exists" });
    }
});

// Логин
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
        res.json({ token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Профиль пользователя
app.get("/user", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ username: req.user.username });
});

// --- Проекты ---

// Получить проекты пользователя
app.get("/projects", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT p.* FROM projects p
       LEFT JOIN project_permissions pp ON p.id = pp.project_id
       WHERE p.owner_id = $1 OR pp.user_id = $1`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Создать проект
app.post("/projects", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { name, description } = req.body;
    try {
        const { rows } = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            name,
            description,
            req.user.id,
        ]);
        await pool.query("INSERT INTO project_permissions (user_id, project_id, role) VALUES ($1, $2, $3)", [req.user.id, rows[0].id, "owner"]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

// Обновить проект
app.put("/projects/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const { rows } = await pool.query("UPDATE projects SET name = $1, description = $2 WHERE id = $3 AND owner_id = $4 RETURNING *", [
            name,
            description,
            id,
            req.user.id,
        ]);
        if (rows.length === 0) {
            return res.status(403).json({ error: "Not authorized or project not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Update project error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

// Удалить проект
app.delete("/projects/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id", [id, req.user.id]);
        if (rows.length === 0) {
            return res.status(403).json({ error: "Not authorized or project not found" });
        }
        res.json({ message: "Project deleted" });
    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// --- Документы ---

// Получить документы проекта
app.get("/projects/:id/documents", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: perms } = await pool.query("SELECT * FROM project_permissions WHERE project_id = $1 AND user_id = $2", [id, req.user.id]);
        if (perms.length === 0) {
            const { rows: project } = await pool.query("SELECT * FROM projects WHERE id = $1 AND owner_id = $2", [id, req.user.id]);
            if (project.length === 0) {
                return res.status(403).json({ error: "Not authorized or project not found" });
            }
        }
        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1", [id]);
        res.json(rows);
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Создать документ
app.post("/projects/:id/documents", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    try {
        const { rows: perms } = await pool.query("SELECT * FROM project_permissions WHERE project_id = $1 AND user_id = $2 AND role IN ($3, $4)", [
            id,
            req.user.id,
            "owner",
            "editor",
        ]);
        if (perms.length === 0) {
            return res.status(403).json({ error: "Not authorized to create documents" });
        }
        const { rows } = await pool.query("INSERT INTO documents (project_id, title, owner_id, content) VALUES ($1, $2, $3, $4) RETURNING *", [
            id,
            title,
            req.user.id,
            "",
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Create document error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

// Обновить документ (метаданные)
app.put("/documents/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    try {
        const { rows } = await pool.query(
            "UPDATE documents SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND owner_id = $3 RETURNING *",
            [title, id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(403).json({ error: "Not authorized or document not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Update document error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

// Удалить документ
app.delete("/documents/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("DELETE FROM documents WHERE id = $1 AND owner_id = $2 RETURNING id", [id, req.user.id]);
        if (rows.length === 0) {
            return res.status(403).json({ error: "Not authorized or document not found" });
        }
        res.json({ message: "Document deleted" });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Настройка WebSocket для socket.io (временная, без y-websocket)
io.on("connection", (socket) => {
    console.log("WebSocket client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("WebSocket client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
