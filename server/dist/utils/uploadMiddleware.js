"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_DIR = exports.uploadDocx = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const UPLOAD_DIR = path_1.default.join(__dirname, "..", "..", "uploads");
exports.UPLOAD_DIR = UPLOAD_DIR;
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const ALLOWED_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Some clients/OSes send a generic type for .docx; extension check below
    // provides the primary safeguard, MIME is a secondary signal.
    "application/octet-stream",
    "application/zip",
]);
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const safeOriginal = sanitizeFilename(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}_${safeOriginal}`);
    },
});
exports.uploadDocx = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        const isDocxExt = path_1.default.extname(file.originalname).toLowerCase() === ".docx";
        const isAcceptableMime = ALLOWED_MIME_TYPES.has(file.mimetype);
        if (!isDocxExt || !isAcceptableMime) {
            cb(new Error("Only .docx files are supported."));
            return;
        }
        cb(null, true);
    },
});
