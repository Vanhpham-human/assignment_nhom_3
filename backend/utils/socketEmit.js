function emitToBoard(req, boardId, event, payload) {
  const io = req.app.get("io");
  if (io && boardId) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}

module.exports = { emitToBoard };
