"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policiesRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const POLICIES_FILE = path_1.default.join(__dirname, "..", "..", "data", "policies.json");
const DEFAULT_POLICIES = {
    PUBLIC: { externalSharingAllowed: true, downloadAllowed: true, encryptionRequired: false, approvalRequired: false },
    INTERNAL: { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: false, approvalRequired: false },
    CONFIDENTIAL: { externalSharingAllowed: false, downloadAllowed: true, encryptionRequired: true, approvalRequired: true },
    RESTRICTED: { externalSharingAllowed: false, downloadAllowed: false, encryptionRequired: true, approvalRequired: true },
};
function readPolicies() {
    if (!fs_1.default.existsSync(POLICIES_FILE)) {
        fs_1.default.mkdirSync(path_1.default.dirname(POLICIES_FILE), { recursive: true });
        fs_1.default.writeFileSync(POLICIES_FILE, JSON.stringify(DEFAULT_POLICIES, null, 2));
    }
    return JSON.parse(fs_1.default.readFileSync(POLICIES_FILE, "utf-8"));
}
function writePolicies(policies) {
    fs_1.default.writeFileSync(POLICIES_FILE, JSON.stringify(policies, null, 2));
}
const router = (0, express_1.Router)();
exports.policiesRouter = router;
router.get("/", (_req, res) => {
    res.json(readPolicies());
});
router.put("/", (req, res) => {
    const incoming = req.body;
    const current = readPolicies();
    const merged = { ...current, ...incoming };
    writePolicies(merged);
    res.json(merged);
});
