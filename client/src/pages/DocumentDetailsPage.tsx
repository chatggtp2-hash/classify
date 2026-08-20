import { useEffect, useState } from "react";
import { downloadUrl, getDocument, reclassify } from "../services/api";
import { Classification, CLASSIFICATIONS, DocumentRecord } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";

interface DocumentDetailsPageProps {
  documentId: string;
  onChanged: () => void;
}

export function DocumentDetailsPage({ documentId, onChanged }: DocumentDetailsPageProps) {
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [newClassification, setNewClassification] = useState<Classification>("INTERNAL");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function load() {
    getDocument(documentId)
      .then((d) => {
        setDoc(d);
        setNewClassification(d.classification);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    setReclassifying(false);
    setReason("");
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleReclassify() {
    if (!reason.trim()) {
      setSubmitError("A reason is required to change the classification.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await reclassify(documentId, newClassification, reason.trim());
      setDoc(updated);
      setReclassifying(false);
      setReason("");
      onChanged();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to reclassify document.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--c-restricted)" }}>{error}</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {doc.currentFilename}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Uploaded {new Date(doc.createdAt).toLocaleString()}
            {doc.updatedAt !== doc.createdAt && ` · Modified ${new Date(doc.updatedAt).toLocaleString()}`}
          </p>
        </div>
        <ClassificationSeal classification={doc.classification} size="lg" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Confidence
          </div>
          <div className="text-xl font-semibold mt-1" style={{ fontFamily: "var(--font-mono)" }}>
            {doc.confidence}%
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Risk score
          </div>
          <div className="text-xl font-semibold mt-1" style={{ fontFamily: "var(--font-mono)" }}>
            {doc.riskScore}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Method
          </div>
          <div className="text-xl font-semibold mt-1">{doc.classificationMethod}</div>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Detected sensitive information
        </h2>
        {doc.findings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No sensitive information detected.
          </p>
        ) : (
          <div className="space-y-2">
            {doc.findings.map((f) => (
              <div
                key={f.type}
                className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{f.type}</span>
                  <span
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: severityColor(f.severity),
                      background: "var(--surface-raised)",
                    }}
                  >
                    {f.severity}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {f.examples.join(", ")}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{f.count}x</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Classification policy
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <PolicyRow label="External sharing" value={doc.policy.externalSharingAllowed ? "Allowed" : "Blocked"} />
          <PolicyRow label="Download" value={doc.policy.downloadAllowed ? "Allowed" : "Restricted"} />
          <PolicyRow label="Encryption" value={doc.policy.encryptionRequired ? "Required" : "Not required"} />
          <PolicyRow label="Approval" value={doc.policy.approvalRequired ? "Required" : "Not required"} />
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
          Prototype policy indicators only — not enforced outside this application.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3 mb-6">
        <a
          href={downloadUrl(doc.id)}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: "var(--accent)", color: "#04222b" }}
        >
          Download classified document ({doc.currentFilename})
        </a>
        <button
          onClick={() => setReclassifying((v) => !v)}
          className="px-4 py-2 rounded-md text-sm font-medium border"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Change classification
        </button>
      </div>

      {reclassifying && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Change classification
          </h2>
          <div className="flex flex-col gap-3 max-w-sm">
            <select
              value={newClassification}
              onChange={(e) => setNewClassification(e.target.value as Classification)}
              className="px-3 py-2 rounded-md text-sm border outline-none"
              style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for this change (required)"
              rows={3}
              className="px-3 py-2 rounded-md text-sm border outline-none resize-none"
              style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
            />
            {submitError && (
              <p className="text-sm" style={{ color: "var(--c-restricted)" }}>
                {submitError}
              </p>
            )}
            <button
              onClick={handleReclassify}
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm font-medium self-start"
              style={{ background: "var(--accent)", color: "#04222b", opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Saving…" : "Save classification"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function severityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "var(--c-restricted)";
    case "HIGH":
      return "var(--c-confidential)";
    case "MEDIUM":
      return "var(--c-internal)";
    default:
      return "var(--text-muted)";
  }
}
