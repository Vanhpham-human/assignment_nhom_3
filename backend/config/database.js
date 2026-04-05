const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

/** URI dùng được trực tiếp trong MongoDB Compass (cùng connection string). */
function withDefaultDb(uri, dbName = "trello_boards") {
  const u = ((uri && uri.trim()) || "mongodb://localhost:27017/").replace(/\s/g, "");
  const m = u.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(\/([^?]*))?(\?.*)?$/);
  if (!m) return u;
  const origin = m[1];
  const afterSlash = m[3] !== undefined ? m[3] : "";
  const query = m[4] || "";
  if (afterSlash === "") {
    return `${origin}/${dbName}${query}`;
  }
  return u;
}

function compassHint(uri) {
  const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  return {
    message: "Mở MongoDB Compass → New connection → dán URI này (hoặc chỉ host + chọn DB trello_boards).",
    uri: masked,
  };
}

async function connectMongo(uri = process.env.MONGODB_URI) {
  const u = withDefaultDb(uri);
  await mongoose.connect(u);
  const hint = compassHint(u);
  console.log("MongoDB connected:", hint.uri);
  console.log("Compass:", hint.message);
  return mongoose.connection;
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = {
  withDefaultDb,
  connectMongo,
  disconnectMongo,
  compassHint,
};
