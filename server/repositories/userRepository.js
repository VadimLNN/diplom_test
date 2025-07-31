const pool = require("../db");

class UserRepository {
    async findByUsername(username) {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [username]);
        return rows[0];
    }

    async findById(userId) {
        const { rows } = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [userId]);
        return rows[0];
    }

    async create({ username, email, hashedPassword }) {
        const { rows } = await pool.query(
            "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
            [username, hashedPassword, email]
        );
        return rows[0];
    }

    async findByEmail(email) {
        const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        return rows[0];
    }
}

module.exports = new UserRepository();
