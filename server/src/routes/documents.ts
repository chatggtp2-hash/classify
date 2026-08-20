import { Router, Request, Response } from "express";
import fs from "fs";
import { uploadDocx } from "../utils/uploadMiddleware";
import {
  DocumentProcessingError,
  processUpload,
  reclassifyDocument,
} from "../services/documentService";
import { getAllDocuments, getAuditEventsForDocument, getDocumentById } from "../services/storageService";
import { Classification } from "../types";

const router = Router();

const VALID_CLASSIFICATIONS: Classification[] = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];

router.post("/upload", (req: Request, res: Response) => {
  uploadDocx.single("file")(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid file upload." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    try {
      const record = await processUpload(req.file.path, req.file.originalname);
      return res.status(201).json(sanitizeDocumentForClient(record));
    } catch (e) {
      if (e instanceof DocumentProcessingError) {
        return res.status(422).json({ error: e.message });
      }
      console.error(e);
      return res
        .status(500)
        .json({ error: "Unable to process this Word document. The document may be corrupted or unsupported." });
    }
  });
});

router.get("/", (_req: Request, res: Response) => {
  const docs = getAllDocuments().map(sanitizeDocumentForClient);
  res.json(docs);
});

router.get("/:id", (req: Request, res: Response) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json(sanitizeDocumentForClient(doc));
});

router.get("/:id/findings", (req: Request, res: Response) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json(doc.findings);
});

router.get("/:id/audit", (req: Request, res: Response) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json(getAuditEventsForDocument(req.params.id));
});

router.post("/:id/reclassify", async (req: Request, res: Response) => {
  const { classification, reason } = req.body as { classification?: string; reason?: string };

  if (!classification || !VALID_CLASSIFICATIONS.includes(classification as Classification)) {
    return res.status(400).json({ error: "A valid classification is required." });
  }
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: "A reason is required to change the classification." });
  }

  try {
    const updated = await reclassifyDocument(req.params.id, classification as Classification, reason);
    res.json(sanitizeDocumentForClient(updated));
  } catch (e) {
    if (e instanceof DocumentProcessingError) {
      return res.status(422).json({ error: e.message });
    }
    console.error(e);
    res.status(500).json({ error: "Failed to reclassify document." });
  }
});

// Single download route - returns the SAME file (metadata-modified,
// classification-prefixed), not a separate generated copy.
router.get("/:id/download", (req: Request, res: Response) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  if (!fs.existsSync(doc.filePath)) {
    return res.status(404).json({ error: "The document file no longer exists on the server." });
  }
  res.download(doc.filePath, doc.currentFilename);
});

function sanitizeDocumentForClient(doc: ReturnType<typeof getDocumentById>) {
  if (!doc) return doc;
  const { filePath, ...rest } = doc;
  return rest;
}

export { router as documentsRouter };
