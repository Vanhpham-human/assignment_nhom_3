function getIo(req) {
  return req.app.get("io");
}

function emitToBoard(req, event, payload) {
  const io = getIo(req);
  const boardId = payload.board_id || payload.boardId || req.params.boardId;
  if (io && boardId) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}

module.exports = { getIo, emitToBoard };
