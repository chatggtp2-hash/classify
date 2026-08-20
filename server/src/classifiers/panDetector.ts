import { Finding } from "../types";
import { maskPan } from "../utils/mask";

// Indian PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

export function detectPan(text: string): Finding | null {
  const matches = text.match(PAN_REGEX) ?? [];
  if (matches.length === 0) return null;

  const unique = [...new Set(matches)];
  const examples = unique.slice(0, 3).map(maskPan);

  return {
    type: "PAN",
    count: matches.length,
    severity: "HIGH",
    examples,
  };
}
