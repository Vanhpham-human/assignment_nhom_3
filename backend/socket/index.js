const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../middlewares/auth");

function registerSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.data.userId = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, getJwtSecret());
      socket.data.userId = payload.sub;
    } catch {
      socket.data.userId = null;
    }
    next();
  });

  io.on("connection", (socket) => {
    socket.emit("socket:connected", { userId: socket.data.userId || null });

    socket.on("board:join", (boardId) => {
      if (typeof boardId !== "string" || !boardId) return;
      socket.join(`board:${boardId}`);
    });

    socket.on("board:leave", (boardId) => {
      if (typeof boardId !== "string") return;
      socket.leave(`board:${boardId}`);
    });
  });
}

module.exports = registerSocket;
