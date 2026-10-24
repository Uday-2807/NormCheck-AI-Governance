const mongoose = require("mongoose");

const brandRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: {
    type: String,
    enum: ["prohibited_phrase", "preferred_term", "approved_fact", "guideline"],
    default: "prohibited_phrase"
  },
  phrase: { type: String, required: true, trim: true, maxlength: 500 },
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  explanation: { type: String, trim: true, maxlength: 1000, default: "" },
  suggestion: { type: String, trim: true, maxlength: 1000, default: "" },
  source: { type: String, trim: true, maxlength: 300, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

brandRuleSchema.index({ active: 1, type: 1 });
module.exports = mongoose.model("BrandRule", brandRuleSchema);
