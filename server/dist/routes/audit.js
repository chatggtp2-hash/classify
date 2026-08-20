"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRouter = void 0;
const express_1 = require("express");
const storageService_1 = require("../services/storageService");
const router = (0, express_1.Router)();
exports.auditRouter = router;
router.get("/", (_req, res) => {
    const events = (0, storageService_1.getAllAuditEvents)();
    const docs = (0, storageService_1.getAllDocuments)();
    const filenameById = new Map(docs.map((d) => [d.id, d.currentFilename]));
    const enriched = events
        .map((e) => ({ ...e, documentFilename: filenameById.get(e.documentId) ?? "Unknown document" }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(enriched);
});
