-- 1. Пользователи
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Проекты (пространства)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Вкладки (текстовый файл, рисовалка, карта и т.д.)
-- ЭТА таблица основная для контента
CREATE TABLE IF NOT EXISTS tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'board', 'code', 'mindmap')),
    
    ydoc_document_name VARCHAR(255) NOT NULL UNIQUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Y.Doc snapshots (бинарные данные редактирования)
CREATE TABLE IF NOT EXISTS yjs_documents (
    id SERIAL PRIMARY KEY,
    ydoc_document_name VARCHAR(255) NOT NULL UNIQUE REFERENCES tabs(ydoc_document_name) ON DELETE CASCADE,
    ydoc_data BYTEA NOT NULL,  -- бинарный snapshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Разрешения на проекты (не на отдельные вкладки)
CREATE TABLE IF NOT EXISTS project_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_project_permission UNIQUE (user_id, project_id)
);

-- Индексы для оптимизации
CREATE INDEX  IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX  IF NOT EXISTS idx_tabs_project_id ON tabs(project_id);
CREATE INDEX  IF NOT EXISTS idx_tabs_ydoc_document_name ON tabs(ydoc_document_name);
CREATE INDEX  IF NOT EXISTS idx_yjs_documents_ydoc_document_name ON yjs_documents(ydoc_document_name);
CREATE INDEX  IF NOT EXISTS idx_project_permissions_user_id ON project_permissions(user_id);
CREATE INDEX  IF NOT EXISTS idx_project_permissions_project_id ON project_permissions(project_id);
