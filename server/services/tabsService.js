const db = require("../db");

// ===============================
// Create tab
// ===============================
async function createTab({ projectId, type, title }) {
    const result = await db.query(
        `
        INSERT INTO tabs (project_id, type, title)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [projectId, type, title]
    );

    return result.rows[0];
}

// ===============================
// Get tabs by project
// ===============================
async function getTabsByProject(projectId) {
    const result = await db.query(
        `
        SELECT id, project_id, type, title, created_at, updated_at
        FROM tabs
        WHERE project_id = $1
        ORDER BY created_at ASC
        `,
        [projectId]
    );

    return result.rows;
}

// ===============================
// Delete tab
// ===============================
async function deleteTab(tabId) {
    await db.query(
        `
        DELETE FROM tabs
        WHERE id = $1
        `,
        [tabId]
    );
}

module.exports = {
    createTab,
    getTabsByProject,
    deleteTab,
};
