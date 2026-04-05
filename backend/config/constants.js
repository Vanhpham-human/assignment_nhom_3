const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

module.exports = {
  ROOT,
  API_PORT: Number(process.env.API_PORT || process.env.PORT) || 3000,
};
