require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const checkRoutes = require("./src/routes/checks");
const brandRuleRoutes = require("./src/routes/brandRules");
const findingRoutes = require("./src/routes/findings");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NormCheck AI API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/check", checkRoutes);
app.use("/api/checks", checkRoutes);
app.use("/api/brand-rules", brandRuleRoutes);
app.use("/api/findings", findingRoutes);

// Serve the supplied static frontend without moving its files.
const frontendPath = path.resolve(__dirname, "../frontend");
app.use(express.static(frontendPath));

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`NormCheck AI running at http://localhost:${PORT}`);
      console.log(`Serving frontend from: ${frontendPath}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

start();
