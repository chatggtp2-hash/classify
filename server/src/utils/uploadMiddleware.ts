import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Some clients/OSes send a generic type for .docx; extension check below
  // provides the primary safeguard, MIME is a secondary signal.
  "application/octet-stream",
  "application/zip",
]);
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeOriginal = sanitizeFilename(file.originalname);
    cb(null, `${uuidv4()}_${safeOriginal}`);
  },
});

export const uploadDocx = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const isDocxExt = path.extname(file.originalname).toLowerCase() === ".docx";
    const isAcceptableMime = ALLOWED_MIME_TYPES.has(file.mimetype);
    if (!isDocxExt || !isAcceptableMime) {
      cb(new Error("Only .docx files are supported."));
      return;
    }
    cb(null, true);
  },
});

export { UPLOAD_DIR };
