"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const documents_1 = require("./routes/documents");
const dashboard_1 = require("./routes/dashboard");
const policies_1 = require("./routes/policies");
const audit_1 = require("./routes/audit");
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/documents", documents_1.documentsRouter);
app.use("/api/dashboard", dashboard_1.dashboardRouter);
app.use("/api/policies", policies_1.policiesRouter);
app.use("/api/audit", audit_1.auditRouter);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
// Serve the built React frontend (client/dist) as a single deployable server.
const CLIENT_DIST = path_1.default.join(__dirname, "..", "..", "client", "dist");
if (fs_1.default.existsSync(CLIENT_DIST)) {
    app.use(express_1.default.static(CLIENT_DIST));
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path_1.default.join(CLIENT_DIST, "index.html"));
    });
}
else {
    app.get("/", (_req, res) => {
        res.send("Client build not found. Run `npm run build:client` from the project root, then restart the server.");
    });
}
// Central error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
});
app.listen(PORT, () => {
    console.log(`Word Classification server running at http://localhost:${PORT}`);
});
