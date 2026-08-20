import { Finding } from "../types";
import { maskDigitsKeepLast } from "../utils/mask";

// Configurable: keywords that must appear near a digit run for it to be
// treated as a bank account number. This is intentionally conservative
// (context-based) to avoid flagging every long number as a bank account.
export interface BankAccountDetectorConfig {
  keywords: string[];
  minDigits: number;
  maxDigits: number;
  proximityChars: number;
}

export const DEFAULT_BANK_ACCOUNT_CONFIG: BankAccountDetectorConfig = {
  keywords: ["account no", "account number", "a/c no", "a/c number", "bank account", "acct no"],
  minDigits: 9,
  maxDigits: 18,
  proximityChars: 40,
};

export function detectBankAccount(
  text: string,
  config: BankAccountDetectorConfig = DEFAULT_BANK_ACCOUNT_CONFIG
): Finding | null {
  const lower = text.toLowerCase();
  const digitRunRegex = /\b\d{9,18}\b/g;
  const matches: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = digitRunRegex.exec(text)) !== null) {
    const digits = match[0];
    if (digits.length < config.minDigits || digits.length > config.maxDigits) continue;

    const start = Math.max(0, match.index - config.proximityChars);
    const context = lower.slice(start, match.index);
    const hasKeyword = config.keywords.some((kw) => context.includes(kw));

    if (hasKeyword) matches.push(digits);
  }

  if (matches.length === 0) return null;

  const examples = [...new Set(matches)].slice(0, 3).map((v) => maskDigitsKeepLast(v, 4));

  return {
    type: "BANK_ACCOUNT",
    count: matches.length,
    severity: "HIGH",
    examples,
  };
}
