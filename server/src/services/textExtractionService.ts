import mammoth from "mammoth";
import fs from "fs";

export class TextExtractionError extends Error {}

export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new TextExtractionError("The document appears to be empty.");
    }
    return result.value;
  } catch (err) {
    if (err instanceof TextExtractionError) throw err;
    throw new TextExtractionError(
      "Unable to process this Word document. The document may be corrupted or unsupported."
    );
  }
}
