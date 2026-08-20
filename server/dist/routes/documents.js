"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const uploadMiddleware_1 = require("../utils/uploadMiddleware");
const documentService_1 = require("../services/documentService");
const storageService_1 = require("../services/storageService");
const router = (0, express_1.Router)();
exports.documentsRouter = router;
const VALID_CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];
router.post("/upload", (req, res) => {
    uploadMiddleware_1.uploadDocx.single("file")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || "Invalid file upload." });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No file was uploaded." });
        }
        try {
            const record = await (0, documentService_1.processUpload)(req.file.path, req.file.originalname);
            return res.status(201).json(sanitizeDocumentForClient(record));
        }
        catch (e) {
            if (e instanceof documentService_1.DocumentProcessingError) {
                return res.status(422).json({ error: e.message });
            }
            console.error(e);
            return res
                .status(500)
                .json({ error: "Unable to process this Word document. The document may be corrupted or unsupported." });
        }
    });
});
router.get("/", (_req, res) => {
    const docs = (0, storageService_1.getAllDocuments)().map(sanitizeDocumentForClient);
    res.json(docs);
});
router.get("/:id", (req, res) => {
    const doc = (0, storageService_1.getDocumentById)(req.params.id);
    if (!doc)
        return res.status(404).json({ error: "Document not found." });
    res.json(sanitizeDocumentForClient(doc));
});
router.get("/:id/findings", (req, res) => {
    const doc = (0, storageService_1.getDocumentById)(req.params.id);
    if (!doc)
        return res.status(404).json({ error: "Document not found." });
    res.json(doc.findings);
});
router.get("/:id/audit", (req, res) => {
    const doc = (0, storageService_1.getDocumentById)(req.params.id);
    if (!doc)
        return res.status(404).json({ error: "Document not found." });
    res.json((0, storageService_1.getAuditEventsForDocument)(req.params.id));
});
router.post("/:id/reclassify", async (req, res) => {
    const { classification, reason } = req.body;
    if (!classification || !VALID_CLASSIFICATIONS.includes(classification)) {
        return res.status(400).json({ error: "A valid classification is required." });
    }
    if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "A reason is required to change the classification." });
    }
    try {
        const updated = await (0, documentService_1.reclassifyDocument)(req.params.id, classification, reason);
        res.json(sanitizeDocumentForClient(updated));
    }
    catch (e) {
        if (e instanceof documentService_1.DocumentProcessingError) {
            return res.status(422).json({ error: e.message });
        }
        console.error(e);
        res.status(500).json({ error: "Failed to reclassify document." });
    }
});
// Single download route - returns the SAME file (metadata-modified,
// classification-prefixed), not a separate generated copy.
router.get("/:id/download", (req, res) => {
    const doc = (0, storageService_1.getDocumentById)(req.params.id);
    if (!doc)
        return res.status(404).json({ error: "Document not found." });
    if (!fs_1.default.existsSync(doc.filePath)) {
        return res.status(404).json({ error: "The document file no longer exists on the server." });
    }
    res.download(doc.filePath, doc.currentFilename);
});
function sanitizeDocumentForClient(doc) {
    if (!doc)
        return doc;
    const { filePath, ...rest } = doc;
    return rest;
}
