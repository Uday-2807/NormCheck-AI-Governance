const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema({
  match: { type: String, required: true },
  label: { type: String, required: true },
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  evidence: { type: String, required: true },
  explanation: { type: String, default: "" },
  suggestion: { type: String, default: "" },
  status: {
    type: String,
    enum: ["confirmed", "potential", "uncertain", "resolved"],
    default: "potential"
  },
  sourceRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "BrandRule", default: null }
}, { timestamps: true });

const checkSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 50000 },
  brandId: { type: String, default: "demo-brand" },
  contentType: { type: String, default: "general" },
  campaignContext: { type: String, default: "" },
  engine: { type: String, default: "deterministic-rules" },
  findings: { type: [findingSchema], default: [] }
}, { timestamps: true });

checkSchema.index({ createdAt: -1 });
module.exports = mongoose.model("Check", checkSchema);
