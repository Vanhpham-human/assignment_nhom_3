const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");

require("./models");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, socket: true });
});

app.use("/api", apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
