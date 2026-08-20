"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCESS_TOKEN_PATTERNS = exports.API_KEY_PATTERNS = void 0;
exports.detectApiKey = detectApiKey;
exports.detectAccessToken = detectAccessToken;
const mask_1 = require("../utils/mask");
// Configurable list of key=value style prefixes that indicate a credential.
exports.API_KEY_PATTERNS = [/api[_-]?key\s*[:=]/i, /secret[_-]?key\s*[:=]/i];
exports.ACCESS_TOKEN_PATTERNS = [/access[_-]?token\s*[:=]/i, /authorization\s*[:=]/i];
function scanAssignments(text, patterns) {
    const lines = text.split(/\r?\n/);
    const hits = [];
    for (const line of lines) {
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                // Capture just the "key=" prefix + a fixed-length mask, never the value.
                const eqIdx = line.search(/[:=]/);
                const prefix = eqIdx >= 0 ? line.slice(0, eqIdx + 1) : line;
                hits.push(prefix.trim());
            }
        }
    }
    return hits;
}
function detectApiKey(text) {
    const hits = scanAssignments(text, exports.API_KEY_PATTERNS);
    if (hits.length === 0)
        return null;
    const examples = [...new Set(hits)].slice(0, 3).map((v) => (0, mask_1.maskSecretAssignment)(v + "="));
    return {
        type: "API_KEY",
        count: hits.length,
        severity: "CRITICAL",
        examples,
    };
}
function detectAccessToken(text) {
    const hits = scanAssignments(text, exports.ACCESS_TOKEN_PATTERNS);
    if (hits.length === 0)
        return null;
    const examples = [...new Set(hits)].slice(0, 3).map((v) => (0, mask_1.maskSecretAssignment)(v + "="));
    return {
        type: "ACCESS_TOKEN",
        count: hits.length,
        severity: "CRITICAL",
        examples,
    };
}
