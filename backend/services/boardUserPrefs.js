const UserBoardStar = require("../models/UserBoardStar");
const UserBoardRecent = require("../models/UserBoardRecent");

async function getStarredBoardIdSet(userId) {
  const rows = await UserBoardStar.find({ user_id: userId }).lean();
  return new Set(rows.map((r) => r.board_id));
}

/** Trả về true nếu sau thao tác bảng đang được user gắn sao. */
async function toggleUserBoardStar(userId, boardId) {
  const existing = await UserBoardStar.findOne({ user_id: userId, board_id: boardId });
  if (existing) {
    await existing.deleteOne();
    return false;
  }
  await UserBoardStar.create({ user_id: userId, board_id: boardId });
  return true;
}

async function recordBoardView(userId, boardId) {
  await UserBoardRecent.findOneAndUpdate(
    { user_id: userId, board_id: boardId },
    { last_viewed_at: new Date() },
    { upsert: true, new: true }
  );
}

/** Map board_id -> last_viewed_at cho user */
async function getRecentViewMap(userId) {
  const rows = await UserBoardRecent.find({ user_id: userId }).lean();
  const m = new Map();
  for (const r of rows) {
    m.set(r.board_id, r.last_viewed_at);
  }
  return m;
}

module.exports = {
  getStarredBoardIdSet,
  toggleUserBoardStar,
  recordBoardView,
  getRecentViewMap,
};
