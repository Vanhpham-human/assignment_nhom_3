const boardService = require("../services/boardService");
const { boardToListItem } = require("../lib/boardDto");
const { emitToBoard } = require("../utils/socketEmit");

async function list(req, res) {
  try {
    res.json(await boardService.listBoardsWithMeta(req.userId));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function create(req, res) {
  try {
    const boardName = String(req.body.name || req.body.title || "").trim();
    if (!boardName) {
      return res.status(400).json({ error: "Tên bảng là bắt buộc" });
    }
    const result = await boardService.createBoardForUser(req.userId, {
      name: boardName,
      background: req.body.background,
      workspace_id: req.body.workspace_id || null,
    });
    if (result.error === "unauthorized") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (result.error === "no_workspace") {
      return res.status(400).json({ error: "Không tìm thấy không gian làm việc" });
    }
    emitToBoard(req, result.board._id, "board:created", {
      board_id: result.board._id,
      workspace_id: result.workspace._id,
    });
    res.status(201).json(boardToListItem(result.board, result.workspace.name));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function toggleStar(req, res) {
  try {
    const { ok, board, workspace, starred } = await boardService.toggleStar(
      req.userId,
      req.params.id
    );
    if (!ok || !board) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, board._id, "board:star", { board_id: board._id, starred });
    res.json(boardToListItem(board, workspace?.name || "", { starred }));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function recordView(req, res) {
  try {
    const { ok } = await boardService.recordView(req.userId, req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, req.params.id, "board:view", {
      board_id: req.params.id,
      user_id: req.userId,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function archive(req, res) {
  try {
    const { ok, board } = await boardService.archiveBoard(req.userId, req.params.id);
    if (!ok || !board) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, board._id, "board:archived", { board_id: board._id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

module.exports = { list, create, toggleStar, recordView, archive };
