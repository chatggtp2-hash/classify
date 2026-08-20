"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessingError = void 0;
exports.processUpload = processUpload;
exports.reclassifyDocument = reclassifyDocument;
exports.getDashboardStats = getDashboardStats;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const classificationEngine_1 = require("../classifiers/classificationEngine");
const textExtractionService_1 = require("./textExtractionService");
const docxMetadataService_1 = require("./docxMetadataService");
const filenamePrefix_1 = require("../utils/filenamePrefix");
const storageService_1 = require("./storageService");
class DocumentProcessingError extends Error {
}
exports.DocumentProcessingError = DocumentProcessingError;
async function processUpload(uploadedPath, originalFilename) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    let text;
    try {
        text = await (0, textExtractionService_1.extractTextFromDocx)(uploadedPath);
    }
    catch (err) {
        if (err instanceof textExtractionService_1.TextExtractionError)
            throw new DocumentProcessingError(err.message);
        throw new DocumentProcessingError("Extraction failure while processing the document.");
    }
    const result = (0, classificationEngine_1.classifyDocument)(text);
    // Modify the SAME uploaded package in place (metadata only), then rename it
    // to reflect the classification - no second/duplicate file is created.
    try {
        await (0, docxMetadataService_1.modifyDocxMetadataInPlace)(uploadedPath, result);
    }
    catch (err) {
        throw new DocumentProcessingError("Failed to update classification metadata in the Word document.");
    }
    const currentFilename = (0, filenamePrefix_1.applyClassificationPrefix)(originalFilename, result.classification);
    const finalPath = path_1.default.join(path_1.default.dirname(uploadedPath), currentFilename);
    fs_1.default.renameSync(uploadedPath, finalPath);
    const record = {
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
    (0, storageService_1.saveDocument)(record);
    (0, storageService_1.appendAuditEvent)({
        id: (0, uuid_1.v4)(),
        documentId: id,
        action: "Document uploaded",
        user: "system",
        timestamp: now,
    });
    (0, storageService_1.appendAuditEvent)({
        id: (0, uuid_1.v4)(),
        documentId: id,
        action: "Automated classification",
        newClassification: result.classification,
        user: "system",
        timestamp: new Date().toISOString(),
    });
    return record;
}
async function reclassifyDocument(documentId, newClassification, reason, user = "user") {
    const doc = (0, storageService_1.getDocumentById)(documentId);
    if (!doc)
        throw new DocumentProcessingError("Document not found.");
    if (!reason || reason.trim().length === 0) {
        throw new DocumentProcessingError("A reason is required to change the classification.");
    }
    if (!fs_1.default.existsSync(doc.filePath)) {
        throw new DocumentProcessingError("The document file no longer exists on the server.");
    }
    const previousClassification = doc.classification;
    // Re-run metadata update against the SAME file (in place), using the
    // document's already-known findings/risk score/reasons/policy.
    try {
        await (0, docxMetadataService_1.modifyDocxMetadataInPlace)(doc.filePath, {
            classification: newClassification,
            confidence: doc.confidence,
            riskScore: doc.riskScore,
            findings: doc.findings,
            reasons: doc.reasons,
            policy: doc.policy,
        });
    }
    catch (err) {
        throw new DocumentProcessingError("Failed to update classification metadata in the Word document.");
    }
    const newFilename = (0, filenamePrefix_1.applyClassificationPrefix)((0, filenamePrefix_1.stripClassificationPrefix)(doc.currentFilename), newClassification);
    const newPath = path_1.default.join(path_1.default.dirname(doc.filePath), newFilename);
    if (newPath !== doc.filePath) {
        fs_1.default.renameSync(doc.filePath, newPath);
    }
    doc.classification = newClassification;
    doc.classificationMethod = "MANUAL";
    doc.policy = policyForClassification(newClassification);
    doc.currentFilename = newFilename;
    doc.filePath = newPath;
    doc.updatedAt = new Date().toISOString();
    (0, storageService_1.saveDocument)(doc);
    (0, storageService_1.appendAuditEvent)({
        id: (0, uuid_1.v4)(),
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
function policyForClassification(classification) {
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
function getDashboardStats() {
    const docs = (0, storageService_1.getAllDocuments)();
    const byClassification = {
        PUBLIC: 0,
        INTERNAL: 0,
        CONFIDENTIAL: 0,
        RESTRICTED: 0,
    };
    const typeCounts = {};
    for (const doc of docs) {
        byClassification[doc.classification] += 1;
        for (const finding of doc.findings) {
            typeCounts[finding.type] = (typeCounts[finding.type] ?? 0) + finding.count;
        }
    }
    const topDetectedDataTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({ type: type, count: count }))
        .sort((a, b) => b.count - a.count);
    return {
        totalDocuments: docs.length,
        byClassification,
        topDetectedDataTypes,
    };
}
