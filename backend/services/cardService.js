const Card = require("../models/Card");
const BoardList = require("../models/BoardList");
const { ensureUserBoardAccess } = require("./boardService");

async function listCardsByBoard(userId, boardId) {
  const { ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok) return { ok: false, cards: null };
  const cards = await Card.find({
    board_id: boardId,
    is_archived: false,
  })
    .sort({ list_id: 1, position: 1 })
    .lean();
  return { ok: true, cards };
}

async function getCardById(userId, boardId, cardId) {
  const { ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok) return { ok: false, card: null };
  const card = await Card.findOne({
    _id: cardId,
    board_id: boardId,
    is_archived: false,
  });
  return { ok: true, card };
}

async function createCard(userId, boardId, { list_id, title, description, position, priority }) {
  const { board, ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok || !board) return { ok: false, card: null, error: "forbidden" };
  const list = await BoardList.findOne({
    _id: list_id,
    board_id: boardId,
    is_archived: false,
  });
  if (!list) return { ok: false, card: null, error: "invalid_list" };
  const last = await Card.findOne({ board_id: boardId, list_id }).sort({ position: -1 });
  const pos = position !== undefined ? Number(position) : (last ? last.position + 1 : 0);
  const card = await Card.create({
    board_id: boardId,
    list_id,
    title: String(title).trim(),
    description: description || undefined,
    position: Number.isNaN(pos) ? 0 : pos,
    priority: priority || "medium",
    created_by: userId,
  });
  return { ok: true, card };
}

async function updateCard(userId, boardId, cardId, payload) {
  const { card, ok } = await getCardById(userId, boardId, cardId);
  if (!ok || !card) return { ok: false, card: null };
  if (payload.list_id !== undefined) {
    const list = await BoardList.findOne({
      _id: payload.list_id,
      board_id: boardId,
      is_archived: false,
    });
    if (!list) return { ok: false, card: null, error: "invalid_list" };
    card.list_id = payload.list_id;
  }
  if (payload.title !== undefined) card.title = String(payload.title).trim();
  if (payload.description !== undefined) card.description = payload.description;
  if (payload.position !== undefined) {
    const n = Number(payload.position);
    if (!Number.isNaN(n)) card.position = n;
  }
  if (payload.priority !== undefined) card.priority = payload.priority;
  if (payload.due_at !== undefined) card.due_at = payload.due_at || null;
  if (payload.cover_url !== undefined) card.cover_url = payload.cover_url;
  await card.save();
  return { ok: true, card };
}

async function archiveCard(userId, boardId, cardId) {
  const { card, ok } = await getCardById(userId, boardId, cardId);
  if (!ok || !card) return { ok: false, card: null };
  card.is_archived = true;
  card.archived_at = new Date();
  await card.save();
  return { ok: true, card };
}

module.exports = {
  listCardsByBoard,
  getCardById,
  createCard,
  updateCard,
  archiveCard,
};
