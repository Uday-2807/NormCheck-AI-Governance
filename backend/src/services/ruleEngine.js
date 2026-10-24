const BrandRule = require("../models/BrandRule");

const DEFAULT_RULES = [
  {
    name: "Absolute guarantee or risk-free claim",
    type: "prohibited_phrase",
    phrase: "guaranteed|guarantee|100%|risk-free",
    severity: "High",
    explanation: "Absolute guarantees and risk-free claims may be unsupported.",
    suggestion: "Replace the absolute claim with a specific, substantiated statement."
  },
  {
    name: "Unsubstantiated superlative",
    type: "prohibited_phrase",
    phrase: "best in the world|#1|number one|world-class",
    severity: "Medium",
    explanation: "Superlative claims may require evidence to substantiate them.",
    suggestion: "Add verifiable evidence or use a more specific description."
  },
  {
    name: "Informal or potentially off-brand tone",
    type: "prohibited_phrase",
    phrase: "cheap|crazy|insane",
    severity: "Low",
    explanation: "This wording may not align with a professional brand voice.",
    suggestion: "Use clear, customer-focused language."
  }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePhrase(phrase) {
  // Allow a rule to contain | separated alternatives; escape each phrase.
  const alternatives = String(phrase).split("|").map(s => s.trim()).filter(Boolean);
  if (!alternatives.length) return null;
  return new RegExp("\\b(?:" + alternatives.map(escapeRegExp).join("|") + ")\\b", "gi");
}

async function runRuleEngine(content) {
  const dbRules = await BrandRule.find({ active: true, type: "prohibited_phrase" }).lean();
  const rules = dbRules.length ? dbRules : DEFAULT_RULES;
  const findings = [];

  for (const rule of rules) {
    const regex = compilePhrase(rule.phrase);
    if (!regex) continue;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 70);
      const end = Math.min(content.length, match.index + match[0].length + 70);
      findings.push({
        match: match[0],
        label: rule.name,
        severity: rule.severity || "Medium",
        evidence: content.slice(start, end),
        explanation: rule.explanation || "",
        suggestion: rule.suggestion || "Review this wording against approved brand guidelines.",
        status: "potential",
        sourceRuleId: rule._id || null
      });
      if (match[0].length === 0) regex.lastIndex++;
    }
  }

  return {
    findings,
    rulesSource: dbRules.length ? "mongodb" : "built-in-fallback"
  };
}

module.exports = { runRuleEngine, DEFAULT_RULES };
