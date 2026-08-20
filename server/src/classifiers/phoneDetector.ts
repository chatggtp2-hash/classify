import { Finding } from "../types";
import { maskDigitsKeepLast } from "../utils/mask";

// Indian mobile numbers: optional +91/91 prefix, then a 10-digit number
// starting with 6-9.
const PHONE_REGEX = /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;

export function detectPhone(text: string): Finding | null {
  const matches = text.match(PHONE_REGEX) ?? [];
  if (matches.length === 0) return null;

  const unique = [...new Set(matches)];
  const examples = unique.slice(0, 3).map((v) => maskDigitsKeepLast(v, 2));

  return {
    type: "PHONE",
    count: matches.length,
    severity: "LOW",
    examples,
  };
}
