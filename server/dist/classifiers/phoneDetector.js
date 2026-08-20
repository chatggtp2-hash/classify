"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPhone = detectPhone;
const mask_1 = require("../utils/mask");
// Indian mobile numbers: optional +91/91 prefix, then a 10-digit number
// starting with 6-9.
const PHONE_REGEX = /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
function detectPhone(text) {
    const matches = text.match(PHONE_REGEX) ?? [];
    if (matches.length === 0)
        return null;
    const unique = [...new Set(matches)];
    const examples = unique.slice(0, 3).map((v) => (0, mask_1.maskDigitsKeepLast)(v, 2));
    return {
        type: "PHONE",
        count: matches.length,
        severity: "LOW",
        examples,
    };
}
