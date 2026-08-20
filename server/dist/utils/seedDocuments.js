"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const docx_1 = require("docx");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const OUT_DIR = path_1.default.join(__dirname, "..", "..", "..", "sample-documents");
async function makeDoc(filename, lines) {
    const doc = new docx_1.Document({
        sections: [
            {
                children: lines.map((line) => new docx_1.Paragraph({ children: [new docx_1.TextRun(line)] })),
            },
        ],
    });
    const buffer = await docx_1.Packer.toBuffer(doc);
    fs_1.default.writeFileSync(path_1.default.join(OUT_DIR, filename), buffer);
    console.log(`Created ${filename}`);
}
async function main() {
    if (!fs_1.default.existsSync(OUT_DIR))
        fs_1.default.mkdirSync(OUT_DIR, { recursive: true });
    await makeDoc("test-internal.docx", [
        "Company Internal Process Document",
        "",
        "This document describes the standard operating procedure for onboarding new office equipment requests.",
        "All requests should be routed through the facilities team ticketing system.",
        "No personal or customer data is contained in this document.",
    ]);
    await makeDoc("test-confidential.docx", [
        "Employee Record",
        "",
        "Name: Priya Sharma",
        "Email: priya.sharma@company.com",
        "Phone: 9876543210",
        "Department: Engineering",
    ]);
    await makeDoc("test-restricted.docx", [
        "Customer KYC Record",
        "",
        "Name: Rahul Verma",
        "Aadhaar: 2345 6789 0123",
        "PAN: ABCDE1234F",
        "Bank account no: 123456789012",
        "Email: rahul.verma@example.com",
        "Phone: 9123456780",
    ]);
    await makeDoc("test-secret.docx", [
        "Deployment Configuration Notes",
        "",
        "api_key=abcdef123456789",
        "password=MySecretPassword123",
    ]);
    console.log("Sample documents generated in /sample-documents");
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
