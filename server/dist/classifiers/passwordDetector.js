"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASSWORD_PATTERNS = void 0;
exports.detectPassword = detectPassword;
const mask_1 = require("../utils/mask");
// Configurable list of key=value style prefixes that indicate a password.
exports.PASSWORD_PATTERNS = [/password\s*[:=]/i, /passwd\s*[:=]/i, /pwd\s*[:=]/i];
function detectPassword(text) {
    const lines = text.split(/\r?\n/);
    const hits = [];
    for (const line of lines) {
        for (const pattern of exports.PASSWORD_PATTERNS) {
            if (pattern.test(line)) {
                const eqIdx = line.search(/[:=]/);
                const prefix = eqIdx >= 0 ? line.slice(0, eqIdx + 1) : line;
                hits.push(prefix.trim());
            }
        }
    }
    if (hits.length === 0)
        return null;
    const examples = [...new Set(hits)].slice(0, 3).map((v) => (0, mask_1.maskSecretAssignment)(v + "="));
    return {
        type: "PASSWORD",
        count: hits.length,
        severity: "CRITICAL",
        examples,
    };
}
