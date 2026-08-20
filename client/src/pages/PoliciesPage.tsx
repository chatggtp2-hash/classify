import { useEffect, useState } from "react";
import { getPolicies } from "../services/api";
import { Classification, CLASSIFICATIONS, Policy } from "../types";
import { Card } from "../components/Card";
import { ClassificationSeal } from "../components/ClassificationSeal";

export function PoliciesPage() {
  const [policies, setPolicies] = useState<Record<Classification, Policy> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies()
      .then(setPolicies)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Classification policies
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Prototype policy indicators applied per classification level. These are not enforced outside
        this application.
      </p>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--c-restricted)" }}>
          {error}
        </p>
      )}

      {!policies ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {CLASSIFICATIONS.map((c) => (
            <Card key={c}>
              <div className="mb-4">
                <ClassificationSeal classification={c} size="lg" />
              </div>
              <div className="space-y-2 text-sm">
                <Row label="External sharing" ok={policies[c].externalSharingAllowed} />
                <Row label="Download" ok={policies[c].downloadAllowed} />
                <Row label="Encryption required" ok={policies[c].encryptionRequired} invert />
                <Row label="Approval required" ok={policies[c].approvalRequired} invert />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, ok, invert = false }: { label: string; ok: boolean; invert?: boolean }) {
  // For "allowed" style rows, ok=true is good (green). For "required" style rows,
  // ok=true just means the requirement is on — shown in amber, not a verdict color.
  const color = invert
    ? ok
      ? "var(--c-confidential)"
      : "var(--text-faint)"
    : ok
      ? "var(--c-public)"
      : "var(--c-restricted)";

  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color, fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{ok ? "YES" : "NO"}</span>
    </div>
  );
}
