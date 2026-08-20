import {
  AuditEvent,
  Classification,
  DashboardStats,
  DocumentRecord,
  Finding,
  Policy,
} from "../types";

const API_BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<DocumentRecord>(res);
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/documents`);
  return handleResponse<DocumentRecord[]>(res);
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  return handleResponse<DocumentRecord>(res);
}

export async function getFindings(id: string): Promise<Finding[]> {
  const res = await fetch(`${API_BASE}/documents/${id}/findings`);
  return handleResponse<Finding[]>(res);
}

export async function getAudit(id: string): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/documents/${id}/audit`);
  return handleResponse<AuditEvent[]>(res);
}

export async function reclassify(
  id: string,
  classification: Classification,
  reason: string
): Promise<DocumentRecord> {
  const res = await fetch(`${API_BASE}/documents/${id}/reclassify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification, reason }),
  });
  return handleResponse<DocumentRecord>(res);
}

export function downloadUrl(id: string): string {
  return `${API_BASE}/documents/${id}/download`;
}

export async function getDashboard(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`);
  return handleResponse<DashboardStats>(res);
}

export async function getPolicies(): Promise<Record<Classification, Policy>> {
  const res = await fetch(`${API_BASE}/policies`);
  return handleResponse<Record<Classification, Policy>>(res);
}
