import { useRef, useState } from "react";
import { uploadDocument } from "../services/api";
import { DocumentRecord } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";

interface UploadPageProps {
  onUploaded: (doc: DocumentRecord) => void;
}

type Status = "idle" | "processing" | "done" | "error";

export function UploadPage({ onUploaded }: UploadPageProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentRecord | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setStatus("error");
      setError("Only .docx files are supported.");
      return;
    }
    setStatus("processing");
    setError(null);
    setResult(null);
    try {
      const doc = await uploadDocument(file);
      setResult(doc);
      setStatus("done");
      onUploaded(doc);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Upload document
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Upload a .docx file to scan it for sensitive information and generate a classified copy.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className="relative overflow-hidden rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-16 text-center transition-colors"
        style={{
          borderColor: dragOver ? "var(--accent)" : "var(--border)",
          background: "var(--surface)",
        }}
      >
        {status === "processing" && <div className="scan-sweep" />}
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <svg width="32" height="32" viewBox="0 0 16 16" fill="none" style={{ color: "var(--accent)" }} className="mb-3">
          <path d="M8 11V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.5 5.5L8 2l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 10v3a1 1 0 001 1h9a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium">
          {status === "processing" ? "Scanning document…" : "Drop a .docx file here, or click to browse"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
          Text is extracted and scanned locally against rule-based detectors.
        </p>
      </div>

      {status === "error" && error && (
        <Card className="mt-6" style={{ borderColor: "var(--c-restricted)" }}>
          <p className="text-sm" style={{ color: "var(--c-restricted)" }}>
            {error}
          </p>
        </Card>
      )}

      {status === "done" && result && (
        <Card className="mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {result.currentFilename}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                Classified automatically · renamed from {result.originalFilename}
              </p>
            </div>
            <ClassificationSeal classification={result.classification} size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                Confidence
              </div>
              <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                {result.confidence}%
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                Risk score
              </div>
              <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                {result.riskScore}
              </div>
            </div>
          </div>

          {result.findings.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>
                Detected sensitive information
              </div>
              <div className="space-y-1.5">
                {result.findings.map((f) => (
                  <div key={f.type} className="flex items-center justify-between text-sm">
                    <span style={{ fontFamily: "var(--font-mono)" }}>{f.type}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {f.count}x · {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
