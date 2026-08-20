"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyDocument = classifyDocument;
const aadhaarDetector_1 = require("./aadhaarDetector");
const panDetector_1 = require("./panDetector");
const emailDetector_1 = require("./emailDetector");
const phoneDetector_1 = require("./phoneDetector");
const bankAccountDetector_1 = require("./bankAccountDetector");
const creditCardDetector_1 = require("./creditCardDetector");
const apiKeyDetector_1 = require("./apiKeyDetector");
const passwordDetector_1 = require("./passwordDetector");
const scoringConfig_1 = require("./scoringConfig");
function runDetectors(text) {
    const detectors = [
        aadhaarDetector_1.detectAadhaar,
        panDetector_1.detectPan,
        emailDetector_1.detectEmail,
        phoneDetector_1.detectPhone,
        bankAccountDetector_1.detectBankAccount,
        creditCardDetector_1.detectCreditCard,
        apiKeyDetector_1.detectApiKey,
        apiKeyDetector_1.detectAccessToken,
        passwordDetector_1.detectPassword,
    ];
    const findings = [];
    for (const detector of detectors) {
        const result = detector(text);
        if (result)
            findings.push(result);
    }
    return findings;
}
function calculateRiskScore(findings) {
    let score = 0;
    for (const finding of findings) {
        const pointsPerHit = scoringConfig_1.POINTS_PER_OCCURRENCE[finding.type] ?? 0;
        const cap = scoringConfig_1.MAX_COUNTED_OCCURRENCES[finding.type] ?? finding.count;
        const countedOccurrences = Math.min(finding.count, cap);
        score += pointsPerHit * countedOccurrences;
    }
    return score;
}
function buildPolicy(classification) {
    switch (classification) {
        case "PUBLIC":
            return {
                externalSharingAllowed: true,
                downloadAllowed: true,
                encryptionRequired: false,
                approvalRequired: false,
            };
        case "INTERNAL":
            return {
                externalSharingAllowed: false,
                downloadAllowed: true,
                encryptionRequired: false,
                approvalRequired: false,
            };
        case "CONFIDENTIAL":
            return {
                externalSharingAllowed: false,
                downloadAllowed: true,
                encryptionRequired: true,
                approvalRequired: true,
            };
        case "RESTRICTED":
            return {
                externalSharingAllowed: false,
                downloadAllowed: false,
                encryptionRequired: true,
                approvalRequired: true,
            };
    }
}
function computeConfidence(findings, forcedRestricted) {
    if (findings.length === 0)
        return 70; // no signal either way -> moderate confidence in INTERNAL default
    // More findings + higher severity => higher confidence in the result.
    const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
    const highCount = findings.filter((f) => f.severity === "HIGH").length;
    let confidence = 75 + criticalCount * 8 + highCount * 5 + Math.min(findings.length * 2, 10);
    if (forcedRestricted)
        confidence = Math.max(confidence, 95);
    return Math.min(confidence, 99);
}
/**
 * Deterministic, rule-based classification of raw document text.
 * No AI/ML involved - pure regex detection + weighted scoring.
 */
function classifyDocument(text, options = {}) {
    const findings = runDetectors(text);
    const riskScore = calculateRiskScore(findings);
    const reasons = [];
    const forcedRestricted = findings.some((f) => scoringConfig_1.FORCE_RESTRICTED_TYPES.includes(f.type));
    if (forcedRestricted) {
        const forcingTypes = findings
            .filter((f) => scoringConfig_1.FORCE_RESTRICTED_TYPES.includes(f.type))
            .map((f) => f.type)
            .join(", ");
        reasons.push(`Critical finding(s) detected (${forcingTypes}) - automatically forced to RESTRICTED.`);
    }
    const uncappedPiiVolume = findings
        .filter((f) => f.type === "EMAIL" || f.type === "PHONE")
        .reduce((sum, f) => sum + f.count, 0);
    let classification;
    if (forcedRestricted) {
        classification = "RESTRICTED";
    }
    else if (findings.length === 0) {
        // No sensitive information detected. Per spec, default must NOT be PUBLIC;
        // PUBLIC only applies when explicitly approved.
        classification = options.explicitlyApprovedPublic ? "PUBLIC" : "INTERNAL";
        reasons.push(options.explicitlyApprovedPublic
            ? "No sensitive information detected and document explicitly approved as public."
            : "No sensitive information detected. Defaulting to INTERNAL (PUBLIC requires explicit approval).");
    }
    else if (uncappedPiiVolume > scoringConfig_1.LARGE_VOLUME_PII_THRESHOLD) {
        classification = "RESTRICTED";
        reasons.push(`Large volume of PII detected (${uncappedPiiVolume} email/phone occurrences) - treated as RESTRICTED.`);
    }
    else if (riskScore <= scoringConfig_1.SCORE_THRESHOLDS.internalMax) {
        classification = "INTERNAL";
        reasons.push(`Risk score ${riskScore} falls within INTERNAL range (0-${scoringConfig_1.SCORE_THRESHOLDS.internalMax}).`);
    }
    else if (riskScore <= scoringConfig_1.SCORE_THRESHOLDS.confidentialMax) {
        classification = "CONFIDENTIAL";
        reasons.push(`Risk score ${riskScore} falls within CONFIDENTIAL range (${scoringConfig_1.SCORE_THRESHOLDS.internalMax + 1}-${scoringConfig_1.SCORE_THRESHOLDS.confidentialMax}).`);
    }
    else {
        classification = "RESTRICTED";
        reasons.push(`Risk score ${riskScore} exceeds CONFIDENTIAL threshold (${scoringConfig_1.SCORE_THRESHOLDS.confidentialMax}).`);
    }
    for (const finding of findings) {
        reasons.push(`Detected ${finding.count}x ${finding.type} (severity ${finding.severity}).`);
    }
    const confidence = computeConfidence(findings, forcedRestricted);
    const policy = buildPolicy(classification);
    return {
        classification,
        confidence,
        riskScore,
        findings,
        reasons,
        policy,
    };
}
