# DataCool — Workflow & Backend Architecture

## 1. End-to-End Workflow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  POST /api/  │────▶│  Text Extraction   │────▶│  Classification  │
│  (Upload    │     │  documents/  │     │  (mammoth)         │     │  Engine          │
│   .docx)    │     │  upload      │     │                    │     │  (8 detectors)   │
└─────────────┘     └──────────────┘     └───────────────────┘     └────────┬─────────┘
                                                                              │
      ┌───────────────────────────────────────────────────────────────────┘
      ▼
┌───────────────┐     ┌────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Risk Scoring  │────▶│  Classification    │────▶│  DOCX Generation  │────▶│  Persistence │
│  (weighted,    │     │  Decision           │     │  (docx + JSZip    │     │  (JSON       │
│  capped)       │     │  (PUBLIC/INTERNAL/  │     │  metadata inject) │     │  storage +   │
│                │     │  CONFIDENTIAL/      │     │                    │     │  audit log)  │
│                │     │  RESTRICTED)        │     │                    │     │              │
└───────────────┘     └────────────────────┘     └──────────────────┘     └──────┬───────┘
                                                                                   │
                                                                                   ▼
                                                                       ┌────────────────────┐
                                                                       │  JSON response to   │
                                                                       │  browser (masked    │
                                                                       │  findings only)      │
                                                                       └────────────────────┘
```

### Step-by-step

1. **Upload** — user drops/selects a `.docx` in the React frontend. `multipart/form-data`
   POST to `/api/documents/upload`.
2. **Validation** (`uploadMiddleware.ts`) — file extension + MIME type checked, size capped
   at 20MB, filename sanitized, stored under a UUID-prefixed name in `server/uploads/`.
3. **Text extraction** (`textExtractionService.ts`) — `mammoth` pulls raw text out of the
   `.docx` XML. Corrupted/empty files are rejected with a clear error before reaching the
   classification engine.
4. **Detection** (`classifiers/*Detector.ts`) — extracted text is run through 8
   independent, regex/context-based detectors. Each detector returns a `Finding` (type,
   count, severity, masked examples) or `null`. No detector ever returns raw sensitive
   values — masking happens inside the detector itself.
5. **Risk scoring** (`scoringConfig.ts` + `classificationEngine.ts`) — each finding
   contributes `points-per-occurrence × min(count, cap)` to a running score. Caps prevent
   one very repetitive document from producing an unbounded score while still letting
   volume matter.
6. **Classification decision** — three rules apply, in order:
   - If any finding is API_KEY / PASSWORD / ACCESS_TOKEN → forced `RESTRICTED`.
   - Else if total email/phone occurrences exceed the large-volume-PII threshold →
     `RESTRICTED`.
   - Else the numeric risk score is mapped to a band: `INTERNAL` (0–9) →
     `CONFIDENTIAL` (10–39) → `RESTRICTED` (40+). No findings at all → `INTERNAL` by
     default (never `PUBLIC` without explicit approval).
   - A `Policy` object (external sharing / download / encryption / approval flags) is
     derived from the final classification.
7. **Classified DOCX generation** (`docxGenerationService.ts`) — a new `.docx` is built
   with the `docx` package: colored header/footer showing the classification, risk
   score/confidence line, and the original text re-flowed as paragraphs. The file is then
   reopened as a zip (`JSZip`) to inject classification metadata directly into
   `docProps/custom.xml` (classification, method, date, detected types, risk score) —
   the `docx` package has no API for arbitrary custom properties, so this is done via
   direct Open XML manipulation.
8. **Persistence** (`storageService.ts`, `documentService.ts`) — the document record and
   two audit events ("uploaded", "automated classification") are appended to
   `server/data/documents.json` and `server/data/audit.json` (flat JSON-file storage — no
   database in this prototype).
9. **Response** — the API returns the document record to the browser with server
   filesystem paths stripped out and all finding examples pre-masked; the frontend
   renders the classification seal, risk score, and findings list.
10. **Manual override** (optional) — a user can later call
    `POST /api/documents/:id/reclassify` with a new classification and a required
    `reason`. This updates the record, recomputes the policy, and appends a
    "manually changed classification" audit event capturing the previous and new
    classification plus the reason.

## 2. Backend Architecture

```
server/
├── src/
│   ├── server.ts                  Express app entrypoint; mounts routers,
│   │                               serves the built React app as static files.
│   │
│   ├── routes/                    HTTP layer — validates input, calls services,
│   │   ├── documents.ts           shapes responses. No business logic here.
│   │   ├── dashboard.ts
│   │   ├── policies.ts
│   │   └── audit.ts
│   │
│   ├── services/                  Orchestration + I/O layer.
│   │   ├── documentService.ts     Coordinates the full upload → classify →
│   │   │                          generate → persist pipeline.
│   │   ├── textExtractionService.ts   Wraps mammoth; translates library
│   │   │                              errors into user-facing messages.
│   │   ├── docxGenerationService.ts   Builds the classified .docx + injects
│   │   │                              custom XML metadata.
│   │   └── storageService.ts      Flat-file JSON persistence for documents
│   │                              and audit events (read/write helpers only).
│   │
│   ├── classifiers/               Pure, stateless business logic — the core
│   │   │                          domain of the app. No I/O, fully unit-testable.
│   │   ├── classificationEngine.ts    Orchestrates all detectors, computes
│   │   │                              risk score, decides classification.
│   │   ├── scoringConfig.ts       Tunable weights/thresholds (points per
│   │   │                          occurrence, caps, forced-RESTRICTED types,
│   │   │                          score bands) — change behavior here without
│   │   │                          touching engine logic.
│   │   ├── aadhaarDetector.ts
│   │   ├── panDetector.ts
│   │   ├── emailDetector.ts
│   │   ├── phoneDetector.ts
│   │   ├── bankAccountDetector.ts
│   │   ├── creditCardDetector.ts
│   │   ├── apiKeyDetector.ts
│   │   └── passwordDetector.ts
│   │
│   ├── utils/
│   │   ├── mask.ts                Masking helpers (never expose raw PII).
│   │   ├── uploadMiddleware.ts    multer config: validation, size limits,
│   │   │                          filename sanitization.
│   │   └── seedDocuments.ts       Dev script to generate sample .docx files.
│   │
│   └── types/index.ts             Shared TypeScript contracts (Finding,
│                                   ClassificationResult, DocumentRecord, etc.)
│
├── data/                          documents.json, audit.json, policies.json
├── uploads/                       Original uploaded files
├── classified/                    Generated classified copies
└── dist/                          Compiled output (npm run build)
```

### Design principles

- **Layered separation** — routes handle HTTP concerns only; services own
  orchestration and side effects (filesystem, generation); classifiers are pure
  functions with no I/O, making the core detection/scoring logic trivial to unit
  test in isolation.
- **Deterministic, not AI-based** — every classification decision is explainable:
  the API returns a `reasons[]` array listing exactly which findings and thresholds
  drove the outcome.
- **Privacy by construction** — detectors mask sensitive values before they ever
  leave the detector function; nothing downstream (storage, API responses, audit
  log) ever sees or persists raw PII.
- **Configuration over hardcoding** — scoring weights, caps, forced-classification
  triggers, and bank-account detection keywords are centralized in config objects
  (`scoringConfig.ts`, `bankAccountDetector.ts`), not scattered through logic.
- **File-based storage** — a JSON-file store stands in for a database in this
  prototype; `storageService.ts` is the single seam where a real database could be
  substituted without touching routes or classifiers.
- **Single deployable server** — Express serves the built React bundle directly, so
  the whole app ships as one Node process (`npm start`) rather than requiring a
  separate frontend host.

## 3. Known Limitation

The generated classified `.docx` re-flows extracted text into new paragraphs; it
does not preserve the original file's formatting, images, or tables, because the
`docx` package authors documents rather than editing existing ones in place.
