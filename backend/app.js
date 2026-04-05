const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");

require("./models");

function createApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });
  return app;
}

module.exports = { createApp };
