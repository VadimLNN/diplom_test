const pool = require("../db");

class UserRepository {
    async findByUsername(username) {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
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

    async findUserWithPassword(userId) {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        return rows[0];
    }

    async updatePassword(userId, newPasswordHash) {
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPasswordHash, userId]);
    }

    async deleteById(userId) {
        // Используем транзакцию, чтобы гарантировать, что либо все удалится, либо ничего
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Сначала удаляем все проекты, где пользователь является владельцем.
            //    Благодаря 'ON DELETE CASCADE' в таблицах `documents` и `project_permissions`,
            //    все связанные документы и разрешения удалятся автоматически.
            await client.query("DELETE FROM projects WHERE owner_id = $1", [userId]);

            // 2. Затем удаляем все записи о разрешениях, где пользователь был участником.
            await client.query("DELETE FROM project_permissions WHERE user_id = $1", [userId]);

            // 3. И только потом удаляем самого пользователя.
            await client.query("DELETE FROM users WHERE id = $1", [userId]);

            await client.query("COMMIT"); // Фиксируем изменения
        } catch (error) {
            await client.query("ROLLBACK"); // Откатываем все изменения в случае ошибки
            console.error("Error in deleteById transaction:", error);
            throw error; // Перебрасываем ошибку дальше
        } finally {
            client.release(); // Возвращаем соединение в пул
        }
    }
}

module.exports = new UserRepository();
