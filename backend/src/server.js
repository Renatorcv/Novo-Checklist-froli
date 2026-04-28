require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const rateLimit = require("express-rate-limit");
const routes  = require("./routes");

const app = express();

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: "Too many requests" })
);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api", routes);

app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀  API running at http://localhost:${PORT}`)
);
