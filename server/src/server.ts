import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { documentsRouter } from "./routes/documents";
import { dashboardRouter } from "./routes/dashboard";
import { policiesRouter } from "./routes/policies";
import { auditRouter } from "./routes/audit";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use("/api/documents", documentsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/policies", policiesRouter);
app.use("/api/audit", auditRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Serve the built React frontend (client/dist) as a single deployable server.
const CLIENT_DIST = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send(
      "Client build not found. Run `npm run build:client` from the project root, then restart the server."
    );
  });
}

// Central error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Word Classification server running at http://localhost:${PORT}`);
});
