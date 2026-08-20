import { Finding } from "../types";
import { maskEmail } from "../utils/mask";

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function detectEmail(text: string): Finding | null {
  const matches = text.match(EMAIL_REGEX) ?? [];
  if (matches.length === 0) return null;

  const unique = [...new Set(matches)];
  const examples = unique.slice(0, 3).map(maskEmail);

  return {
    type: "EMAIL",
    count: matches.length,
    severity: "LOW",
    examples,
  };
}
