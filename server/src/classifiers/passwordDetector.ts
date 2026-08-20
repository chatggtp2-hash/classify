import { Finding } from "../types";
import { maskSecretAssignment } from "../utils/mask";

// Configurable list of key=value style prefixes that indicate a password.
export const PASSWORD_PATTERNS = [/password\s*[:=]/i, /passwd\s*[:=]/i, /pwd\s*[:=]/i];

export function detectPassword(text: string): Finding | null {
  const lines = text.split(/\r?\n/);
  const hits: string[] = [];

  for (const line of lines) {
    for (const pattern of PASSWORD_PATTERNS) {
      if (pattern.test(line)) {
        const eqIdx = line.search(/[:=]/);
        const prefix = eqIdx >= 0 ? line.slice(0, eqIdx + 1) : line;
        hits.push(prefix.trim());
      }
    }
  }

  if (hits.length === 0) return null;

  const examples = [...new Set(hits)].slice(0, 3).map((v) => maskSecretAssignment(v + "="));

  return {
    type: "PASSWORD",
    count: hits.length,
    severity: "CRITICAL",
    examples,
  };
}
