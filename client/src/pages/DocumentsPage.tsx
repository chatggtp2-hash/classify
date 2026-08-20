import { useEffect, useMemo, useState } from "react";
import { listDocuments } from "../services/api";
import { Classification, CLASSIFICATIONS, DocumentRecord } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";

interface DocumentsPageProps {
  onSelect: (id: string) => void;
  refreshKey: number;
}

export function DocumentsPage({ onSelect, refreshKey }: DocumentsPageProps) {
  const [docs, setDocs] = useState<DocumentRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<Classification | "ALL">("ALL");
  const [methodFilter, setMethodFilter] = useState<"ALL" | "AUTO" | "MANUAL">("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!docs) return [];
    return docs
      .filter((d) => classFilter === "ALL" || d.classification === classFilter)
      .filter((d) => methodFilter === "ALL" || d.classificationMethod === methodFilter)
      .filter((d) => d.currentFilename.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [docs, classFilter, methodFilter, query]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Documents
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        All documents that have been scanned and classified.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename…"
          className="px-3 py-2 rounded-md text-sm border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", minWidth: 220 }}
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as Classification | "ALL")}
          className="px-3 py-2 rounded-md text-sm border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <option value="ALL">All classifications</option>
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as "ALL" | "AUTO" | "MANUAL")}
          className="px-3 py-2 rounded-md text-sm border outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <option value="ALL">All methods</option>
          <option value="AUTO">Automated</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--c-restricted)" }}>
          {error}
        </p>
      )}

      <Card padded={false}>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left border-b"
              style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
            >
              <th className="py-3 px-4 font-medium">Document</th>
              <th className="py-3 px-4 font-medium">Classification</th>
              <th className="py-3 px-4 font-medium text-right">Risk</th>
              <th className="py-3 px-4 font-medium text-right">Findings</th>
              <th className="py-3 px-4 font-medium">Method</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {docs === null ? (
              <tr>
                <td className="py-6 px-4" colSpan={7} style={{ color: "var(--text-muted)" }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="py-6 px-4" colSpan={7} style={{ color: "var(--text-faint)" }}>
                  No documents match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b last:border-0 cursor-pointer hover:bg-white/[0.02]"
                  style={{ borderColor: "var(--border-soft)" }}
                  onClick={() => onSelect(doc.id)}
                >
                  <td className="py-3 px-4">{doc.currentFilename}</td>
                  <td className="py-3 px-4">
                    <ClassificationSeal classification={doc.classification} />
                  </td>
                  <td className="py-3 px-4 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {doc.riskScore}
                  </td>
                  <td className="py-3 px-4 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    {doc.findings.length}
                  </td>
                  <td className="py-3 px-4" style={{ color: "var(--text-muted)" }}>
                    {doc.classificationMethod}
                  </td>
                  <td className="py-3 px-4" style={{ color: "var(--text-muted)" }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: "var(--accent)" }}>
                    View →
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
