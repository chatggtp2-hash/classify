import { Classification } from "../types";

const KNOWN_PREFIXES: Classification[] = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];

// Strips a leading classification prefix (e.g. "CONFIDENTIAL_") if present,
// so reclassification never stacks prefixes (RESTRICTED_CONFIDENTIAL_x.docx).
export function stripClassificationPrefix(filename: string): string {
  for (const prefix of KNOWN_PREFIXES) {
    const marker = `${prefix}_`;
    if (filename.startsWith(marker)) {
      return filename.slice(marker.length);
    }
  }
  return filename;
}

export function applyClassificationPrefix(filename: string, classification: Classification): string {
  const base = stripClassificationPrefix(filename);
  return `${classification}_${base}`;
}
