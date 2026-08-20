"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDocuments = getAllDocuments;
exports.getDocumentById = getDocumentById;
exports.saveDocument = saveDocument;
exports.getAllAuditEvents = getAllAuditEvents;
exports.getAuditEventsForDocument = getAuditEventsForDocument;
exports.appendAuditEvent = appendAuditEvent;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, "..", "..", "data");
const DOCUMENTS_FILE = path_1.default.join(DATA_DIR, "documents.json");
const AUDIT_FILE = path_1.default.join(DATA_DIR, "audit.json");
function ensureDataFiles() {
    if (!fs_1.default.existsSync(DATA_DIR))
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs_1.default.existsSync(DOCUMENTS_FILE))
        fs_1.default.writeFileSync(DOCUMENTS_FILE, "[]", "utf-8");
    if (!fs_1.default.existsSync(AUDIT_FILE))
        fs_1.default.writeFileSync(AUDIT_FILE, "[]", "utf-8");
}
function readJson(filePath) {
    ensureDataFiles();
    const raw = fs_1.default.readFileSync(filePath, "utf-8");
    return JSON.parse(raw || "[]");
}
function writeJson(filePath, data) {
    ensureDataFiles();
    fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
// ---------- Documents ----------
function getAllDocuments() {
    return readJson(DOCUMENTS_FILE);
}
function getDocumentById(id) {
    return getAllDocuments().find((d) => d.id === id);
}
function saveDocument(doc) {
    const all = getAllDocuments();
    const idx = all.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
        all[idx] = doc;
    }
    else {
        all.push(doc);
    }
    writeJson(DOCUMENTS_FILE, all);
}
// ---------- Audit ----------
function getAllAuditEvents() {
    return readJson(AUDIT_FILE);
}
function getAuditEventsForDocument(documentId) {
    return getAllAuditEvents()
        .filter((e) => e.documentId === documentId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
function appendAuditEvent(event) {
    const all = getAllAuditEvents();
    all.push(event);
    writeJson(AUDIT_FILE, all);
}
