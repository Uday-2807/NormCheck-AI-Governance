const express = require("express");
const mongoose = require("mongoose");
const Check = require("../models/Check");

const router = express.Router();
const allowedStatuses = ["confirmed", "potential", "uncertain", "resolved"];

// PATCH /api/findings/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowedStatuses.join(", ")}`
      });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid finding ID" });
    }

    const check = await Check.findOne({ "findings._id": req.params.id });
    if (!check) return res.status(404).json({ success: false, message: "Finding not found" });

    const finding = check.findings.id(req.params.id);
    finding.status = status;
    await check.save();

    res.json({ success: true, finding });
  } catch (error) { next(error); }
});

module.exports = router;
