const express = require("express");
const mongoose = require("mongoose");
const Check = require("../models/Check");
const { runRuleEngine } = require("../services/ruleEngine");

const router = express.Router();

// POST /api/check (also mounted at /api/checks)
router.post("/", async (req, res, next) => {
  try {
    const { content, text, brandId, contentType, campaignContext } = req.body || {};
    const submittedContent = typeof content === "string" ? content : text;

    if (typeof submittedContent !== "string" || !submittedContent.trim()) {
      return res.status(400).json({ success: false, message: "content must be a non-empty string" });
    }
    if (submittedContent.length > 50000) {
      return res.status(413).json({ success: false, message: "Content cannot exceed 50,000 characters" });
    }

    const { findings, rulesSource } = await runRuleEngine(submittedContent);
    const check = await Check.create({
      content: submittedContent,
      brandId: typeof brandId === "string" ? brandId : "demo-brand",
      contentType: typeof contentType === "string" ? contentType : "general",
      campaignContext: typeof campaignContext === "string" ? campaignContext : "",
      engine: "deterministic-rules",
      findings
    });

    res.status(201).json({
      success: true,
      checkId: check._id,
      createdAt: check.createdAt,
      engine: "deterministic-rules",
      rulesSource,
      findings: check.findings,
      summary: {
        totalFindings: check.findings.length,
        highSeverity: check.findings.filter(f => ["High", "Critical"].includes(f.severity)).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/checks?limit=20
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const checks = await Check.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, count: checks.length, checks });
  } catch (error) {
    next(error);
  }
});

// GET /api/checks/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid check ID" });
    }
    const check = await Check.findById(req.params.id);
    if (!check) return res.status(404).json({ success: false, message: "Check not found" });
    res.json({ success: true, check });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
