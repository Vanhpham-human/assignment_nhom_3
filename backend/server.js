/**
 * Chỉ khởi động kết nối: MongoDB → HTTP (Express) + Socket.io cùng cổng.
 * Route & logic API: app.js — sự kiện socket: socket.js
 */
const http = require("http");
const { Server } = require("socket.io");
const { connectMongo } = require("./config/database");
const { createApp } = require("./app");
const { registerSocket } = require("./socket");

const PORT = Number(process.env.API_PORT || process.env.PORT) || 3000;

async function main() {
  await connectMongo();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });
  app.set("io", io);
  registerSocket(io);

  server.listen(PORT, () => {
    console.log(`API + Socket.io http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
