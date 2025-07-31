const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole, getUserRoleInProject } = require("../middleware/checkRole");

// Сервис
const documentService = require("../services/documentService");

router.use(authMiddleware);

// GET /api/documents/project/:projectId
router.get("/project/:projectId", checkProjectAccess, async (req, res) => {
    try {
        const documents = await documentService.getDocumentsForProject(req.params.projectId);
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: "Server error fetching documents" });
    }
});

// GET /api/documents/:id
router.get("/:id", async (req, res) => {
    try {
        const document = await documentService.getDocumentById(req.params.id);
        if (!document) return res.status(404).json({ error: "Document not found" });

        // Проверяем доступ к проекту, в котором находится документ
        req.params.projectId = document.project_id;
        checkProjectAccess(req, res, () => res.json(document));
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/documents/project/:projectId
router.post("/project/:projectId", [checkProjectAccess, hasRole(["owner", "editor"])], async (req, res) => {
    try {
        const newDocument = await documentService.createDocument(req.user.id, req.params.projectId, req.body);
        res.status(201).json(newDocument);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/documents/:id
router.put("/:id", async (req, res) => {
    try {
        const updatedDocument = await documentService.updateDocument(req.user.id, req.params.id, req.body);
        res.json(updatedDocument);
    } catch (error) {
        // Ловим ошибку из сервиса и используем ее статус-код
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
    try {
        await documentService.deleteDocument(req.user.id, req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

module.exports = router;
