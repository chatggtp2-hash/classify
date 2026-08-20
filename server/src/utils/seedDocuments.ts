import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(__dirname, "..", "..", "..", "sample-documents");

async function makeDoc(filename: string, lines: string[]) {
  const doc = new Document({
    sections: [
      {
        children: lines.map((line) => new Paragraph({ children: [new TextRun(line)] })),
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  console.log(`Created ${filename}`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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
