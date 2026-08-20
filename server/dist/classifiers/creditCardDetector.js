"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCreditCard = detectCreditCard;
const mask_1 = require("../utils/mask");
// Matches runs of 13-19 digits, optionally grouped with spaces or hyphens.
const CARD_CANDIDATE_REGEX = /\b(?:\d[ -]?){13,19}\b/g;
function luhnCheck(digits) {
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alternate) {
            n *= 2;
            if (n > 9)
                n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    return sum % 10 === 0;
}
function detectCreditCard(text) {
    const candidates = text.match(CARD_CANDIDATE_REGEX) ?? [];
    const valid = [];
    for (const candidate of candidates) {
        const digits = candidate.replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19)
            continue;
        if (luhnCheck(digits))
            valid.push(digits);
    }
    if (valid.length === 0)
        return null;
    const examples = [...new Set(valid)].slice(0, 3).map((v) => (0, mask_1.maskDigitsKeepLast)(v, 4));
    return {
        type: "CREDIT_CARD",
        count: valid.length,
        severity: "HIGH",
        examples,
    };
}
