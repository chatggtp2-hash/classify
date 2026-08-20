import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { classifyDocument } from "../classifiers/classificationEngine";
import { extractTextFromDocx, TextExtractionError } from "./textExtractionService";
import { modifyDocxMetadataInPlace } from "./docxMetadataService";
import { applyClassificationPrefix, stripClassificationPrefix } from "../utils/filenamePrefix";
import { appendAuditEvent, getAllDocuments, getDocumentById, saveDocument } from "./storageService";
import { Classification, DashboardStats, DocumentRecord, FindingType } from "../types";

export class DocumentProcessingError extends Error {}

export async function processUpload(
  uploadedPath: string,
  originalFilename: string
): Promise<DocumentRecord> {
  const id = uuidv4();
  const now = new Date().toISOString();

  let text: string;
  try {
    text = await extractTextFromDocx(uploadedPath);
  } catch (err) {
    if (err instanceof TextExtractionError) throw new DocumentProcessingError(err.message);
    throw new DocumentProcessingError("Extraction failure while processing the document.");
  }

  const result = classifyDocument(text);

  // Modify the SAME uploaded package in place (metadata only), then rename it
  // to reflect the classification - no second/duplicate file is created.
  try {
    await modifyDocxMetadataInPlace(uploadedPath, result);
  } catch (err) {
    throw new DocumentProcessingError("Failed to update classification metadata in the Word document.");
  }

  const currentFilename = applyClassificationPrefix(originalFilename, result.classification);
  const finalPath = path.join(path.dirname(uploadedPath), currentFilename);
  fs.renameSync(uploadedPath, finalPath);

  const record: DocumentRecord = {
    id,
    originalFilename,
    currentFilename,
    filePath: finalPath,
    classification: result.classification,
    confidence: result.confidence,
    riskScore: result.riskScore,
    findings: result.findings,
    reasons: result.reasons,
    policy: result.policy,
    classificationMethod: "RULE_BASED",
    createdAt: now,
    updatedAt: now,
  };

  saveDocument(record);

  appendAuditEvent({
    id: uuidv4(),
    documentId: id,
    action: "Document uploaded",
    user: "system",
    timestamp: now,
  });

  appendAuditEvent({
    id: uuidv4(),
    documentId: id,
    action: "Automated classification",
    newClassification: result.classification,
    user: "system",
    timestamp: new Date().toISOString(),
  });

  return record;
}

export async function reclassifyDocument(
  documentId: string,
  newClassification: Classification,
  reason: string,
  user = "user"
): Promise<DocumentRecord> {
  const doc = getDocumentById(documentId);
  if (!doc) throw new DocumentProcessingError("Document not found.");
  if (!reason || reason.trim().length === 0) {
    throw new DocumentProcessingError("A reason is required to change the classification.");
  }
  if (!fs.existsSync(doc.filePath)) {
    throw new DocumentProcessingError("The document file no longer exists on the server.");
  }

  const previousClassification = doc.classification;

  // Re-run metadata update against the SAME file (in place), using the
  // document's already-known findings/risk score/reasons/policy.
  try {
    await modifyDocxMetadataInPlace(doc.filePath, {
      classification: newClassification,
      confidence: doc.confidence,
      riskScore: doc.riskScore,
      findings: doc.findings,
      reasons: doc.reasons,
      policy: doc.policy,
    });
  } catch (err) {
    throw new DocumentProcessingError("Failed to update classification metadata in the Word document.");
  }

  const newFilename = applyClassificationPrefix(
    stripClassificationPrefix(doc.currentFilename),
    newClassification
  );
  const newPath = path.join(path.dirname(doc.filePath), newFilename);
  if (newPath !== doc.filePath) {
    fs.renameSync(doc.filePath, newPath);
  }

  doc.classification = newClassification;
  doc.classificationMethod = "MANUAL";
  doc.policy = policyForClassification(newClassification);
  doc.currentFilename = newFilename;
  doc.filePath = newPath;
  doc.updatedAt = new Date().toISOString();

  saveDocument(doc);

  appendAuditEvent({
    id: uuidv4(),
    documentId,
    action: "User manually changed classification",
    previousClassification,
    newClassification,
    user,
    reason,
    timestamp: new Date().toISOString(),
  });

  return doc;
}

function policyForClassification(classification: Classification) {
  switch (classification) {
    case "PUBLIC":
      return { externalSharingAllowed: true, downloadAllowed: true, encryptionRequired: false, approvalRequired: false };
    case "INTERNAL":
      return { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: false, approvalRequired: false };
    case "CONFIDENTIAL":
      return { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: true, approvalRequired: true };
    case "RESTRICTED":
      return { externalSharingAllowed: false, downloadAllowed: false, encryptionRequired: true, approvalRequired: true };
  }
}

export function getDashboardStats(): DashboardStats {
  const docs = getAllDocuments();

  const byClassification: DashboardStats["byClassification"] = {
    PUBLIC: 0,
    INTERNAL: 0,
    CONFIDENTIAL: 0,
    RESTRICTED: 0,
  };

  const typeCounts: Partial<Record<FindingType, number>> = {};

  for (const doc of docs) {
    byClassification[doc.classification] += 1;
    for (const finding of doc.findings) {
      typeCounts[finding.type] = (typeCounts[finding.type] ?? 0) + finding.count;
    }
  }

  const topDetectedDataTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type: type as FindingType, count: count as number }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDocuments: docs.length,
    byClassification,
    topDetectedDataTypes,
  };
}
