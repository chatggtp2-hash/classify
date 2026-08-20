"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BANK_ACCOUNT_CONFIG = void 0;
exports.detectBankAccount = detectBankAccount;
const mask_1 = require("../utils/mask");
exports.DEFAULT_BANK_ACCOUNT_CONFIG = {
    keywords: ["account no", "account number", "a/c no", "a/c number", "bank account", "acct no"],
    minDigits: 9,
    maxDigits: 18,
    proximityChars: 40,
};
function detectBankAccount(text, config = exports.DEFAULT_BANK_ACCOUNT_CONFIG) {
    const lower = text.toLowerCase();
    const digitRunRegex = /\b\d{9,18}\b/g;
    const matches = [];
    let match;
    while ((match = digitRunRegex.exec(text)) !== null) {
        const digits = match[0];
        if (digits.length < config.minDigits || digits.length > config.maxDigits)
            continue;
        const start = Math.max(0, match.index - config.proximityChars);
        const context = lower.slice(start, match.index);
        const hasKeyword = config.keywords.some((kw) => context.includes(kw));
        if (hasKeyword)
            matches.push(digits);
    }
    if (matches.length === 0)
        return null;
    const examples = [...new Set(matches)].slice(0, 3).map((v) => (0, mask_1.maskDigitsKeepLast)(v, 4));
    return {
        type: "BANK_ACCOUNT",
        count: matches.length,
        severity: "HIGH",
        examples,
    };
}
