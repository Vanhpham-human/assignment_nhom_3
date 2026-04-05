const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { connectMongo } = require("./config/database");
const { API_PORT } = require("./config/constants");
const { seedIfEmpty } = require("./seed");
const registerSocket = require("./socket");

async function main() {
  await connectMongo();
  await seedIfEmpty();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });
  app.set("io", io);
  registerSocket(io);

  server.listen(API_PORT, () => {
    console.log(`HTTP API http://localhost:${API_PORT}`);
    console.log(`Socket.io cùng cổng — client: io(url, { auth: { token } })`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
