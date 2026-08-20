import { Classification, ClassificationResult, Finding, Policy } from "../types";
import { detectAadhaar } from "./aadhaarDetector";
import { detectPan } from "./panDetector";
import { detectEmail } from "./emailDetector";
import { detectPhone } from "./phoneDetector";
import { detectBankAccount } from "./bankAccountDetector";
import { detectCreditCard } from "./creditCardDetector";
import { detectApiKey, detectAccessToken } from "./apiKeyDetector";
import { detectPassword } from "./passwordDetector";
import {
  POINTS_PER_OCCURRENCE,
  MAX_COUNTED_OCCURRENCES,
  FORCE_RESTRICTED_TYPES,
  SCORE_THRESHOLDS,
  LARGE_VOLUME_PII_THRESHOLD,
} from "./scoringConfig";

function runDetectors(text: string): Finding[] {
  const detectors = [
    detectAadhaar,
    detectPan,
    detectEmail,
    detectPhone,
    detectBankAccount,
    detectCreditCard,
    detectApiKey,
    detectAccessToken,
    detectPassword,
  ];

  const findings: Finding[] = [];
  for (const detector of detectors) {
    const result = detector(text);
    if (result) findings.push(result);
  }
  return findings;
}

function calculateRiskScore(findings: Finding[]): number {
  let score = 0;
  for (const finding of findings) {
    const pointsPerHit = POINTS_PER_OCCURRENCE[finding.type] ?? 0;
    const cap = MAX_COUNTED_OCCURRENCES[finding.type] ?? finding.count;
    const countedOccurrences = Math.min(finding.count, cap);
    score += pointsPerHit * countedOccurrences;
  }
  return score;
}

function buildPolicy(classification: Classification): Policy {
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

function computeConfidence(findings: Finding[], forcedRestricted: boolean): number {
  if (findings.length === 0) return 70; // no signal either way -> moderate confidence in INTERNAL default
  // More findings + higher severity => higher confidence in the result.
  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  let confidence = 75 + criticalCount * 8 + highCount * 5 + Math.min(findings.length * 2, 10);
  if (forcedRestricted) confidence = Math.max(confidence, 95);
  return Math.min(confidence, 99);
}

/**
 * Deterministic, rule-based classification of raw document text.
 * No AI/ML involved - pure regex detection + weighted scoring.
 */
export function classifyDocument(
  text: string,
  options: { explicitlyApprovedPublic?: boolean } = {}
): ClassificationResult {
  const findings = runDetectors(text);
  const riskScore = calculateRiskScore(findings);
  const reasons: string[] = [];

  const forcedRestricted = findings.some((f) => FORCE_RESTRICTED_TYPES.includes(f.type));
  if (forcedRestricted) {
    const forcingTypes = findings
      .filter((f) => FORCE_RESTRICTED_TYPES.includes(f.type))
      .map((f) => f.type)
      .join(", ");
    reasons.push(`Critical finding(s) detected (${forcingTypes}) - automatically forced to RESTRICTED.`);
  }

  const uncappedPiiVolume = findings
    .filter((f) => f.type === "EMAIL" || f.type === "PHONE")
    .reduce((sum, f) => sum + f.count, 0);

  let classification: Classification;

  if (forcedRestricted) {
    classification = "RESTRICTED";
  } else if (findings.length === 0) {
    // No sensitive information detected. Per spec, default must NOT be PUBLIC;
    // PUBLIC only applies when explicitly approved.
    classification = options.explicitlyApprovedPublic ? "PUBLIC" : "INTERNAL";
    reasons.push(
      options.explicitlyApprovedPublic
        ? "No sensitive information detected and document explicitly approved as public."
        : "No sensitive information detected. Defaulting to INTERNAL (PUBLIC requires explicit approval)."
    );
  } else if (uncappedPiiVolume > LARGE_VOLUME_PII_THRESHOLD) {
    classification = "RESTRICTED";
    reasons.push(
      `Large volume of PII detected (${uncappedPiiVolume} email/phone occurrences) - treated as RESTRICTED.`
    );
  } else if (riskScore <= SCORE_THRESHOLDS.internalMax) {
    classification = "INTERNAL";
    reasons.push(`Risk score ${riskScore} falls within INTERNAL range (0-${SCORE_THRESHOLDS.internalMax}).`);
  } else if (riskScore <= SCORE_THRESHOLDS.confidentialMax) {
    classification = "CONFIDENTIAL";
    reasons.push(
      `Risk score ${riskScore} falls within CONFIDENTIAL range (${SCORE_THRESHOLDS.internalMax + 1}-${SCORE_THRESHOLDS.confidentialMax}).`
    );
  } else {
    classification = "RESTRICTED";
    reasons.push(`Risk score ${riskScore} exceeds CONFIDENTIAL threshold (${SCORE_THRESHOLDS.confidentialMax}).`);
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
