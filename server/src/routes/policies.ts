import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Classification, Policy } from "../types";

const POLICIES_FILE = path.join(__dirname, "..", "..", "data", "policies.json");

const DEFAULT_POLICIES: Record<Classification, Policy> = {
  PUBLIC: { externalSharingAllowed: true, downloadAllowed: true, encryptionRequired: false, approvalRequired: false },
  INTERNAL: { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: false, approvalRequired: false },
  CONFIDENTIAL: { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: true, approvalRequired: true },
  RESTRICTED: { externalSharingAllowed: false, downloadAllowed: false, encryptionRequired: true, approvalRequired: true },
};

function readPolicies(): Record<Classification, Policy> {
  if (!fs.existsSync(POLICIES_FILE)) {
    fs.mkdirSync(path.dirname(POLICIES_FILE), { recursive: true });
    fs.writeFileSync(POLICIES_FILE, JSON.stringify(DEFAULT_POLICIES, null, 2));
  }
  return JSON.parse(fs.readFileSync(POLICIES_FILE, "utf-8"));
}

function writePolicies(policies: Record<Classification, Policy>): void {
  fs.writeFileSync(POLICIES_FILE, JSON.stringify(policies, null, 2));
}

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(readPolicies());
});

router.put("/", (req: Request, res: Response) => {
  const incoming = req.body as Partial<Record<Classification, Policy>>;
  const current = readPolicies();
  const merged = { ...current, ...incoming };
  writePolicies(merged);
  res.json(merged);
});

export { router as policiesRouter };
