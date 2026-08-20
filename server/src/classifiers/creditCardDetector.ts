import { Finding } from "../types";
import { maskDigitsKeepLast } from "../utils/mask";

// Matches runs of 13-19 digits, optionally grouped with spaces or hyphens.
const CARD_CANDIDATE_REGEX = /\b(?:\d[ -]?){13,19}\b/g;

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function detectCreditCard(text: string): Finding | null {
  const candidates = text.match(CARD_CANDIDATE_REGEX) ?? [];
  const valid: string[] = [];

  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) continue;
    if (luhnCheck(digits)) valid.push(digits);
  }

  if (valid.length === 0) return null;

  const examples = [...new Set(valid)].slice(0, 3).map((v) => maskDigitsKeepLast(v, 4));

  return {
    type: "CREDIT_CARD",
    count: valid.length,
    severity: "HIGH",
    examples,
  };
}
