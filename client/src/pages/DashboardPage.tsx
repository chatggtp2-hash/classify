import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import { Classification, DashboardStats } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";
import { Page } from "../components/Sidebar";

const ORDER: Classification[] = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
  refreshKey: number;
}

export function DashboardPage({ onNavigate, refreshKey }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--c-restricted)" }}>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--text-muted)" }}>Loading dashboard…</p>
      </div>
    );
  }

  const maxTypeCount = Math.max(1, ...stats.topDetectedDataTypes.map((t) => t.count));

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Overview of document classification activity.
          </p>
        </div>
        <button
          onClick={() => onNavigate("upload")}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: "var(--accent)", color: "#04222b" }}
        >
          Upload document
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Total documents
          </div>
          <div
            className="text-3xl font-semibold mt-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {stats.totalDocuments}
          </div>
        </Card>
        {ORDER.map((c) => (
          <Card key={c}>
            <div className="mb-2">
              <ClassificationSeal classification={c} />
            </div>
            <div className="text-3xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
              {stats.byClassification[c]}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Top detected data types
        </h2>
        {stats.topDetectedDataTypes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No findings yet. Upload a document to begin.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.topDetectedDataTypes.map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <div
                  className="w-36 text-xs shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                >
                  {t.type}
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(t.count / maxTypeCount) * 100}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <div
                  className="w-10 text-right text-xs shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}
                >
                  {t.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
