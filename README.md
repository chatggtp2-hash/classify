# Sentinel — Word Document Information Classification Prototype

A rule-based prototype that scans `.docx` files for sensitive information, assigns an
information classification (PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED), and generates
a labeled copy of the document. Single Express server serves both the API and the built
React frontend.

## Prerequisites

- Node.js 18+ (tested on Node 22)
- npm 9+

## Install

From the project root:

```bash
npm run install:all
```

This installs the root, `client/`, and `server/` dependencies.

## Build

```bash
npm run build
```

Builds the React frontend (`client/dist`) and compiles the TypeScript backend
(`server/dist`).

## Start

```bash
npm start
```

Starts the Express server, which serves the API and the built frontend together.

## Application URL

http://localhost:4000

(Port can be overridden with the `PORT` environment variable.)

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload a `.docx` file (`multipart/form-data`, field `file`). Extracts text, runs it through the classification engine, generates a labeled classified copy, and returns the document record. |
| GET | `/api/documents` | List all classified documents. |
| GET | `/api/documents/:id` | Get a single document's details. |
| GET | `/api/documents/:id/findings` | Get the detected sensitive-data findings for a document. |
| GET | `/api/documents/:id/audit` | Get the audit trail for a document. |
| POST | `/api/documents/:id/reclassify` | Manually override a document's classification. Body: `{ classification, reason }` — `reason` is required. |
| GET | `/api/documents/:id/download` | Download the classified document — the SAME file that was uploaded, renamed with a classification prefix (e.g. `RESTRICTED_customer_data.docx`) and with classification metadata embedded. No separate copy is created. |
| GET | `/api/dashboard` | Aggregate stats: document counts by classification, top detected data types. |
| GET | `/api/policies` | Get the policy indicators (sharing/download/encryption/approval) per classification level. |
| PUT | `/api/policies` | Update policy indicators. |
| GET | `/api/audit` | Global audit event history across all documents. |
| GET | `/api/health` | Health check. |

## How DOCX Classification Works

1. **Text extraction** — the uploaded `.docx` is parsed with `mammoth` to extract raw text
   (used only for detection; the file itself is untouched at this stage).
2. **Detection** — the extracted text is run through 8 rule-based detectors (regex/context
   based, no AI/ML):
   - Aadhaar numbers
   - PAN numbers
   - Email addresses
   - Phone numbers (Indian mobile format)
   - Bank account numbers (keyword-proximity based)
   - Credit card numbers (Luhn-validated)
   - API keys (`api_key=`, `secret_key=` style assignments)
   - Passwords / access tokens (`password=`, `access_token=` style assignments)

   All detected values are masked before being stored or returned (e.g. `XXXXXXXX9012`) —
   raw sensitive values are never persisted or sent to the client.
3. **Risk scoring** — each finding type contributes weighted points (capped per type to
   avoid runaway scores from repeated occurrences). API keys, passwords, and access
   tokens automatically force classification to `RESTRICTED` regardless of score.
4. **Classification** — the risk score is mapped to a classification band
   (`INTERNAL` → `CONFIDENTIAL` → `RESTRICTED`); documents with no sensitive information
   default to `INTERNAL`.
5. **In-place metadata update** — the **same uploaded `.docx` package** is opened as a zip
   (Open XML) and only its metadata parts are edited — `docProps/custom.xml` gets
   `InformationClassification`, `RiskScore`, `ClassificationMethod` (`RULE_BASED`),
   `ClassificationDate`, and `DetectedDataTypes`. The document body (`word/document.xml`),
   headers, footers, images, and tables are never touched, so the file opens identically
   in Word. No second/duplicate file is generated.
6. **Rename** — the file is renamed with a classification prefix, e.g.
   `customer_data.docx` → `RESTRICTED_customer_data.docx`. If the filename already carries
   a classification prefix (from a prior classification), that prefix is stripped before
   the new one is applied, so prefixes never stack.
7. **Audit trail** — every upload, automated classification, and manual reclassification
   (which requires a reason) is recorded and viewable per-document or globally. Manual
   reclassification re-applies steps 5–6 against the same file.
