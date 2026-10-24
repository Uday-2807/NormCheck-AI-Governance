const express = require("express");
const mongoose = require("mongoose");
const BrandRule = require("../models/BrandRule");

const router = express.Router();
const allowedTypes = ["prohibited_phrase", "preferred_term", "approved_fact", "guideline"];
const allowedSeverities = ["Low", "Medium", "High", "Critical"];

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.includeInactive === "true" ? {} : { active: true };
    const rules = await BrandRule.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: rules.length, rules });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, phrase, type, severity, explanation, suggestion, source, active } = req.body || {};
    if (!name?.trim() || !phrase?.trim()) {
      return res.status(400).json({ success: false, message: "name and phrase are required" });
    }
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid rule type" });
    }
    if (severity && !allowedSeverities.includes(severity)) {
      return res.status(400).json({ success: false, message: "Invalid severity" });
    }
    const rule = await BrandRule.create({ name, phrase, type, severity, explanation, suggestion, source, active });
    res.status(201).json({ success: true, rule });
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rule ID" });
    }
    const allowed = ["name", "phrase", "type", "severity", "explanation", "suggestion", "source", "active"];
    const update = {};
    for (const key of allowed) if (req.body && req.body[key] !== undefined) update[key] = req.body[key];
    const rule = await BrandRule.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    res.json({ success: true, rule });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rule ID" });
    }
    const rule = await BrandRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    res.json({ success: true, message: "Brand rule deleted" });
  } catch (error) { next(error); }
});

module.exports = router;
