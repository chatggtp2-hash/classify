"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripClassificationPrefix = stripClassificationPrefix;
exports.applyClassificationPrefix = applyClassificationPrefix;
const KNOWN_PREFIXES = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];
// Strips a leading classification prefix (e.g. "CONFIDENTIAL_") if present,
// so reclassification never stacks prefixes (RESTRICTED_CONFIDENTIAL_x.docx).
function stripClassificationPrefix(filename) {
    for (const prefix of KNOWN_PREFIXES) {
        const marker = `${prefix}_`;
        if (filename.startsWith(marker)) {
            return filename.slice(marker.length);
        }
    }
    return filename;
}
function applyClassificationPrefix(filename, classification) {
    const base = stripClassificationPrefix(filename);
    return `${classification}_${base}`;
}
