import { Finding, FindingType } from "../types";
import { maskSecretAssignment } from "../utils/mask";

// Configurable list of key=value style prefixes that indicate a credential.
export const API_KEY_PATTERNS = [/api[_-]?key\s*[:=]/i, /secret[_-]?key\s*[:=]/i];
export const ACCESS_TOKEN_PATTERNS = [/access[_-]?token\s*[:=]/i, /authorization\s*[:=]/i];

function scanAssignments(text: string, patterns: RegExp[]): string[] {
  const lines = text.split(/\r?\n/);
  const hits: string[] = [];
  for (const line of lines) {
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        // Capture just the "key=" prefix + a fixed-length mask, never the value.
        const eqIdx = line.search(/[:=]/);
        const prefix = eqIdx >= 0 ? line.slice(0, eqIdx + 1) : line;
        hits.push(prefix.trim());
      }
    }
  }
  return hits;
}

export function detectApiKey(text: string): Finding | null {
  const hits = scanAssignments(text, API_KEY_PATTERNS);
  if (hits.length === 0) return null;

  const examples = [...new Set(hits)].slice(0, 3).map((v) => maskSecretAssignment(v + "="));

  return {
    type: "API_KEY" as FindingType,
    count: hits.length,
    severity: "CRITICAL",
    examples,
  };
}

export function detectAccessToken(text: string): Finding | null {
  const hits = scanAssignments(text, ACCESS_TOKEN_PATTERNS);
  if (hits.length === 0) return null;

  const examples = [...new Set(hits)].slice(0, 3).map((v) => maskSecretAssignment(v + "="));

  return {
    type: "ACCESS_TOKEN" as FindingType,
    count: hits.length,
    severity: "CRITICAL",
    examples,
  };
}
