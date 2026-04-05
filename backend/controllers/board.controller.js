const boardService = require("../services/boardService");
const Workspace = require("../models/Workspace");
const { boardToListItem } = require("../utils/boardDto");
const { emitToBoard } = require("../utils/socketEmit");

async function list(req, res) {
  try {
    const rows = await boardService.listBoardsWithMeta(req.userId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function create(req, res) {
  try {
    const { title, background, name, workspace_id } = req.body;
    const boardName = String(name || title || "").trim();
    const result = await boardService.createBoardForUser(req.userId, {
      name: boardName,
      background,
      workspace_id,
    });
    if (result.error === "unauthorized") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (result.error === "no_workspace") {
      return res.status(400).json({ error: "Không tìm thấy không gian làm việc" });
    }
    emitToBoard(req, "board:created", {
      board_id: result.board._id,
      workspace_id: result.workspace._id,
    });
    res.status(201).json(boardToListItem(result.board, result.workspace.name));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function updateOne(req, res) {
  try {
    const { name, description } = req.body;
    const { ok, board } = await boardService.updateBoard(req.userId, req.params.id, {
      name,
      description,
    });
    if (!ok || !board) return res.status(404).json({ error: "Not found" });
    const workspace = await Workspace.findById(board.workspace_id);
    emitToBoard(req, "board:updated", {
      board_id: board._id,
      name: board.name,
      description: board.description,
    });
    res.json(boardToListItem(board, workspace?.name || ""));
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
    emitToBoard(req, "board:star", { board_id: board._id, starred });
    res.json(
      boardToListItem(board, workspace?.name || "", {
        starred,
      })
    );
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function recordView(req, res) {
  try {
    const { ok } = await boardService.recordView(req.userId, req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, "board:view", { board_id: req.params.id, user_id: req.userId });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function archive(req, res) {
  try {
    const { ok, board } = await boardService.archiveBoard(req.userId, req.params.id);
    if (!ok || !board) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, "board:archived", { board_id: board._id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

module.exports = { list, create, updateOne, toggleStar, recordView, archive };
