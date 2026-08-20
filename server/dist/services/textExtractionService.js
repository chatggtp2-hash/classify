"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractionError = void 0;
exports.extractTextFromDocx = extractTextFromDocx;
const mammoth_1 = __importDefault(require("mammoth"));
const fs_1 = __importDefault(require("fs"));
class TextExtractionError extends Error {
}
exports.TextExtractionError = TextExtractionError;
async function extractTextFromDocx(filePath) {
    try {
        const buffer = fs_1.default.readFileSync(filePath);
        const result = await mammoth_1.default.extractRawText({ buffer });
        if (!result.value || result.value.trim().length === 0) {
            throw new TextExtractionError("The document appears to be empty.");
        }
        return result.value;
    }
    catch (err) {
        if (err instanceof TextExtractionError)
            throw err;
        throw new TextExtractionError("Unable to process this Word document. The document may be corrupted or unsupported.");
    }
}
