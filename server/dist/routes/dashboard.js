"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const documentService_1 = require("../services/documentService");
const router = (0, express_1.Router)();
exports.dashboardRouter = router;
router.get("/", (_req, res) => {
    res.json((0, documentService_1.getDashboardStats)());
});
