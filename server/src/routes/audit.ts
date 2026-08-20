import { Router, Request, Response } from "express";
import { getAllAuditEvents, getAllDocuments } from "../services/storageService";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const events = getAllAuditEvents();
  const docs = getAllDocuments();
  const filenameById = new Map(docs.map((d) => [d.id, d.currentFilename]));

  const enriched = events
    .map((e) => ({ ...e, documentFilename: filenameById.get(e.documentId) ?? "Unknown document" }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(enriched);
});

export { router as auditRouter };
