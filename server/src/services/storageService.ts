import fs from "fs";
import path from "path";
import { AuditEvent, DocumentRecord } from "../types";

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");

function ensureDataFiles(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DOCUMENTS_FILE)) fs.writeFileSync(DOCUMENTS_FILE, "[]", "utf-8");
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, "[]", "utf-8");
}

function readJson<T>(filePath: string): T {
  ensureDataFiles();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw || "[]") as T;
}

function writeJson<T>(filePath: string, data: T): void {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- Documents ----------

export function getAllDocuments(): DocumentRecord[] {
  return readJson<DocumentRecord[]>(DOCUMENTS_FILE);
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  return getAllDocuments().find((d) => d.id === id);
}

export function saveDocument(doc: DocumentRecord): void {
  const all = getAllDocuments();
  const idx = all.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    all[idx] = doc;
  } else {
    all.push(doc);
  }
  writeJson(DOCUMENTS_FILE, all);
}

// ---------- Audit ----------

export function getAllAuditEvents(): AuditEvent[] {
  return readJson<AuditEvent[]>(AUDIT_FILE);
}

export function getAuditEventsForDocument(documentId: string): AuditEvent[] {
  return getAllAuditEvents()
    .filter((e) => e.documentId === documentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function appendAuditEvent(event: AuditEvent): void {
  const all = getAllAuditEvents();
  all.push(event);
  writeJson(AUDIT_FILE, all);
}
