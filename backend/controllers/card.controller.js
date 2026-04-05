const cardService = require("../services/cardService");
const { emitToBoard } = require("../utils/socketEmit");

async function list(req, res) {
  try {
    const { ok, cards } = await cardService.listCardsByBoard(req.userId, req.params.boardId);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function create(req, res) {
  try {
    const { list_id, title, description, position, priority } = req.body;
    const result = await cardService.createCard(req.userId, req.params.boardId, {
      list_id,
      title,
      description,
      position,
      priority,
    });
    if (!result.ok) {
      if (result.error === "forbidden") return res.status(404).json({ error: "Not found" });
      if (result.error === "invalid_list") {
        return res.status(400).json({ error: "list_id không thuộc bảng này" });
      }
      return res.status(400).json({ error: "Không tạo được thẻ" });
    }
    emitToBoard(req, "card:created", {
      board_id: req.params.boardId,
      card: result.card.toObject ? result.card.toObject() : result.card,
    });
    res.status(201).json(result.card);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function update(req, res) {
  try {
    const result = await cardService.updateCard(
      req.userId,
      req.params.boardId,
      req.params.cardId,
      req.body
    );
    if (!result.ok || !result.card) {
      if (result.error === "invalid_list") {
        return res.status(400).json({ error: "list_id không hợp lệ" });
      }
      return res.status(404).json({ error: "Not found" });
    }
    emitToBoard(req, "card:updated", {
      board_id: req.params.boardId,
      card: result.card.toObject ? result.card.toObject() : result.card,
    });
    res.json(result.card);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function remove(req, res) {
  try {
    const result = await cardService.archiveCard(
      req.userId,
      req.params.boardId,
      req.params.cardId
    );
    if (!result.ok || !result.card) return res.status(404).json({ error: "Not found" });
    emitToBoard(req, "card:deleted", {
      board_id: req.params.boardId,
      card_id: req.params.cardId,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

module.exports = { list, create, update, remove };
