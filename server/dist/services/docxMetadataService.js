"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyDocxMetadataInPlace = modifyDocxMetadataInPlace;
const jszip_1 = __importDefault(require("jszip"));
const fs_1 = __importDefault(require("fs"));
// This service intentionally does NOT use the `docx` package to rebuild the
// document. It opens the uploaded .docx as a zip (Open XML package), edits
// only the metadata parts, and writes the same package back out. Document
// body content (document.xml, headers, footers, images, tables) is never
// touched, so the file is byte-identical in every part except the metadata
// XML below.
async function modifyDocxMetadataInPlace(filePath, result) {
    const fileBuffer = fs_1.default.readFileSync(filePath);
    const zip = await jszip_1.default.loadAsync(fileBuffer);
    const now = new Date().toISOString();
    const detectedTypes = result.findings.map((f) => f.type).join(",");
    await updateCoreProperties(zip, result.classification);
    await upsertCustomProperties(zip, {
        InformationClassification: result.classification,
        RiskScore: String(result.riskScore),
        ClassificationMethod: "RULE_BASED",
        ClassificationDate: now,
        DetectedDataTypes: detectedTypes,
    });
    const newBuffer = await zip.generateAsync({ type: "nodebuffer" });
    fs_1.default.writeFileSync(filePath, newBuffer);
}
// Keep docProps/core.xml's built-in "category" field roughly in sync for
// Word's own Info panel, without touching any other core property.
async function updateCoreProperties(zip, classification) {
    const corePath = "docProps/core.xml";
    const coreXml = await zip.file(corePath)?.async("text");
    if (!coreXml)
        return; // Not fatal - custom properties still carry classification.
    let updated;
    if (/<cp:category>.*<\/cp:category>/s.test(coreXml)) {
        updated = coreXml.replace(/<cp:category>.*<\/cp:category>/s, `<cp:category>${classification}</cp:category>`);
    }
    else {
        updated = coreXml.replace("</cp:coreProperties>", `<cp:category>${classification}</cp:category></cp:coreProperties>`);
    }
    zip.file(corePath, updated);
}
async function upsertCustomProperties(zip, properties) {
    const customPath = "docProps/custom.xml";
    const existingXml = await zip.file(customPath)?.async("text");
    // Parse existing <property name="..." pid="..."> entries (if any) so we
    // don't collide pids or lose unrelated custom properties on reclassification.
    const existingProps = new Map();
    let maxPid = 2;
    if (existingXml) {
        const propRegex = /<property[^>]*pid="(\d+)"[^>]*name="([^"]+)"[^>]*>\s*<vt:lpwstr>([\s\S]*?)<\/vt:lpwstr>\s*<\/property>/g;
        let m;
        while ((m = propRegex.exec(existingXml)) !== null) {
            const pid = parseInt(m[1], 10);
            existingProps.set(unescapeXml(m[2]), { pid, value: unescapeXml(m[3]) });
            if (pid > maxPid)
                maxPid = pid;
        }
    }
    for (const [name, value] of Object.entries(properties)) {
        const existing = existingProps.get(name);
        existingProps.set(name, { pid: existing?.pid ?? ++maxPid, value });
    }
    const propertyXmlParts = [...existingProps.entries()].map(([name, { pid, value }]) => `<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="${pid}" name="${escapeXml(name)}"><vt:lpwstr>${escapeXml(value)}</vt:lpwstr></property>`);
    const customXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
${propertyXmlParts.join("\n")}
</Properties>`;
    zip.file(customPath, customXml);
    // Ensure the part is registered so Word recognizes it (only needed the
    // first time; harmless no-op if already present).
    const contentTypesPath = "[Content_Types].xml";
    const contentTypesXml = await zip.file(contentTypesPath)?.async("text");
    if (contentTypesXml && !contentTypesXml.includes("docProps/custom.xml")) {
        const updated = contentTypesXml.replace("</Types>", `<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>`);
        zip.file(contentTypesPath, updated);
    }
    const relsPath = "_rels/.rels";
    const relsXml = await zip.file(relsPath)?.async("text");
    if (relsXml && !relsXml.includes("docProps/custom.xml")) {
        const updated = relsXml.replace("</Relationships>", `<Relationship Id="rIdCustomProps" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>`);
        zip.file(relsPath, updated);
    }
}
function escapeXml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
function unescapeXml(value) {
    return value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}
