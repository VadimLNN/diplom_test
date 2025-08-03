const pool = require("./db"); // Наш "умный" db.js

// Эта функция будет выполняться один раз перед запуском всех тестов
beforeAll(async () => {
    //console.log("--- JEST SETUP: CREATING TABLES IN TEST DB ---");
    // Здесь вы можете вставить SQL для создания ваших таблиц
    // Это гарантирует, что структура тестовой базы всегда актуальна
    await pool.query(`
        -- Таблица пользователей
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица проектов
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            owner_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица документов
        CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            title VARCHAR(100) NOT NULL,
            content TEXT, -- Markdown содержимое
            owner_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица разрешений для совместной работы
        CREATE TABLE IF NOT EXISTS project_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
        CONSTRAINT unique_user_project_permission UNIQUE (user_id, project_id)
        );

        -- Индексы для оптимизации
        CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_permissions_user_id ON project_permissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_project_permissions_project_id ON project_permissions(project_id);
    `);
});

// Эта функция будет выполняться перед КАЖДЫМ тестовым файлом (или `describe` блоком)
beforeEach(async () => {
    // Очищаем таблицы в правильном порядке, чтобы избежать ошибок внешних ключей
    await pool.query("TRUNCATE TABLE project_permissions, documents, projects, users RESTART IDENTITY CASCADE");
});

// Эта функция будет выполняться один раз после всех тестов
afterAll(async () => {
    //console.log("--- JEST TEARDOWN: CLOSING DB POOL ---");
    if (pool.totalCount > 0) {
        await pool.end();
    } // Закрываем соединение с базой, чтобы Jest мог корректно завершиться
});
