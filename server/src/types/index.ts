export type Classification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingType =
  | "AADHAAR"
  | "PAN"
  | "EMAIL"
  | "PHONE"
  | "BANK_ACCOUNT"
  | "CREDIT_CARD"
  | "API_KEY"
  | "PASSWORD"
  | "ACCESS_TOKEN";

export interface Finding {
  type: FindingType;
  count: number;
  severity: Severity;
  examples: string[]; // masked examples only
}

export interface Policy {
  externalSharingAllowed: boolean;
  downloadAllowed: boolean;
  encryptionRequired: boolean;
  approvalRequired: boolean;
}

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  riskScore: number;
  findings: Finding[];
  reasons: string[];
  policy: Policy;
}

export type ClassificationMethod = "RULE_BASED" | "MANUAL";

export interface DocumentRecord {
  id: string;
  originalFilename: string; // filename as uploaded, e.g. customer_data.docx
  currentFilename: string; // filename after classification prefix, e.g. RESTRICTED_customer_data.docx
  filePath: string; // path to the SINGLE active file on disk (metadata-modified in place)
  classification: Classification;
  confidence: number;
  riskScore: number;
  findings: Finding[];
  reasons: string[];
  policy: Policy;
  classificationMethod: ClassificationMethod;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  documentId: string;
  action: string;
  previousClassification?: Classification;
  newClassification?: Classification;
  user: string;
  timestamp: string;
  reason?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  byClassification: Record<Classification, number>;
  topDetectedDataTypes: { type: FindingType; count: number }[];
}
