import { Finding } from "../types";
import { maskDigitsKeepLast } from "../utils/mask";

// Matches 12-digit Aadhaar-style numbers, optionally grouped as 4-4-4 with
// space or hyphen separators. This is a structural check only (not the real
// Verhoeff checksum used by UIDAI) - good enough for a rule-based prototype.
const AADHAAR_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export function detectAadhaar(text: string): Finding | null {
  const matches = text.match(AADHAAR_REGEX) ?? [];
  // Filter out obvious false positives: pure runs of the same digit, or
  // sequences that are actually part of a longer digit run (e.g. 16-digit card).
  const valid = matches.filter((m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length !== 12) return false;
    if (/^(\d)\1{11}$/.test(digits)) return false; // all same digit
    return true;
  });

  if (valid.length === 0) return null;

  const examples = [...new Set(valid)].slice(0, 3).map((v) => maskDigitsKeepLast(v, 4));

  return {
    type: "AADHAAR",
    count: valid.length,
    severity: "CRITICAL",
    examples,
  };
}
