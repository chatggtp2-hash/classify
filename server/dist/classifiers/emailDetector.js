"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEmail = detectEmail;
const mask_1 = require("../utils/mask");
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
function detectEmail(text) {
    const matches = text.match(EMAIL_REGEX) ?? [];
    if (matches.length === 0)
        return null;
    const unique = [...new Set(matches)];
    const examples = unique.slice(0, 3).map(mask_1.maskEmail);
    return {
        type: "EMAIL",
        count: matches.length,
        severity: "LOW",
        examples,
    };
}
