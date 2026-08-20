import { Router, Request, Response } from "express";
import { getDashboardStats } from "../services/documentService";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(getDashboardStats());
});

export { router as dashboardRouter };
