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
const Y = require("yjs"); // Импорт yjs
const { encodeStateAsUpdate, applyUpdate } = require("yjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
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
        credentials: true,
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

// Получить документы проекта
app.get("/projects/:id/documents", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
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
    console.log("Received request body:", req.body); // Отладка
    try {
        if (!title || typeof title !== "string") {
            return res.status(400).json({ error: "Invalid data: title is required" });
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
    const { title, content } = req.body;
    console.log("Updating document:", { id, title, content }); // Отладка
    try {
        const { rows } = await pool.query("UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *", [
            title,
            content,
            id,
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Document not found" });
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

// WebSocket с yjs на едином порту
const docs = new Map();

io.on("connection", (socket) => {
    console.log("WebSocket client connected:", socket.id);

    socket.on("joinDocument", (documentId) => {
        console.log(`${socket.id} joined document: document_${documentId}`); // Явный уникальный ключ
        let ydoc = docs.get(`document_${documentId}`); // Добавляем префикс для уникальности
        if (!ydoc) {
            ydoc = new Y.Doc();
            docs.set(`document_${documentId}`, ydoc);
            console.log(`Created new Y.Doc for document_${documentId}`);
        }

        // Отправляем текущее состояние
        const state = encodeStateAsUpdate(ydoc);
        socket.emit("documentSync", Array.from(state));

        socket.on("documentUpdate", (update) => {
            try {
                const uintUpdate = new Uint8Array(update);
                applyUpdate(ydoc, uintUpdate);
                console.log(`Applied update to document_${documentId}`);
                socket.broadcast.to(`document_${documentId}`).emit("documentUpdate", update); // Рассылка в комнате
            } catch (error) {
                console.error(`Error applying update to document_${documentId}:`, error);
            }
        });

        socket.on("disconnect", () => {
            console.log("WebSocket client disconnected:", socket.id);
            if (io.sockets.adapter.rooms.get(`document_${documentId}`)?.size === 0) {
                docs.delete(`document_${documentId}`);
                ydoc.destroy();
                console.log(`Destroyed Y.Doc for document_${documentId}`);
            }
        });

        // Присоединяем сокет к комнате
        socket.join(`document_${documentId}`);
    });
});

app.get("/projects/all", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM projects");
        res.json(rows);
    } catch (error) {
        console.error("Fetch all projects error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
