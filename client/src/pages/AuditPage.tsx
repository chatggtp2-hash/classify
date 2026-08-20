import { useEffect, useState } from "react";
import { AuditEvent, Classification } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";

interface AuditEventWithFilename extends AuditEvent {
  documentFilename: string;
}

interface AuditPageProps {
  refreshKey: number;
  onSelectDocument: (id: string) => void;
}

export function AuditPage({ refreshKey, onSelectDocument }: AuditPageProps) {
  const [events, setEvents] = useState<AuditEventWithFilename[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load audit history.");
        return r.json();
      })
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Audit history
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        A complete record of uploads, automated classifications, and manual overrides.
      </p>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--c-restricted)" }}>
          {error}
        </p>
      )}

      {!events ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : events.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No audit events yet. Upload a document to get started.
          </p>
        </Card>
      ) : (
        <div className="relative pl-6">
          <div
            className="absolute left-[7px] top-1 bottom-1 w-px"
            style={{ background: "var(--border)" }}
            aria-hidden
          />
          <div className="space-y-5">
            {events.map((e) => (
              <div key={e.id} className="relative">
                <div
                  className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2"
                  style={{ background: "var(--bg)", borderColor: dotColor(e) }}
                  aria-hidden
                />
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => onSelectDocument(e.documentId)}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--text)" }}
                    >
                      {e.documentFilename}
                    </button>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}
                    >
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                    {e.action}
                  </p>
                  {(e.previousClassification || e.newClassification) && (
                    <div className="flex items-center gap-2 mb-2">
                      {e.previousClassification && (
                        <ClassificationSeal classification={e.previousClassification} />
                      )}
                      {e.previousClassification && e.newClassification && (
                        <span style={{ color: "var(--text-faint)" }}>→</span>
                      )}
                      {e.newClassification && <ClassificationSeal classification={e.newClassification} />}
                    </div>
                  )}
                  {e.reason && (
                    <p className="text-xs italic" style={{ color: "var(--text-faint)" }}>
                      Reason: {e.reason}
                    </p>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function dotColor(e: AuditEventWithFilename): string {
  const c: Classification | undefined = e.newClassification;
  switch (c) {
    case "PUBLIC":
      return "var(--c-public)";
    case "INTERNAL":
      return "var(--c-internal)";
    case "CONFIDENTIAL":
      return "var(--c-confidential)";
    case "RESTRICTED":
      return "var(--c-restricted)";
    default:
      return "var(--text-faint)";
  }
}
