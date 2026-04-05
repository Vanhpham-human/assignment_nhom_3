const Board = require("../models/Board");
const BoardMember = require("../models/BoardMember");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { getWorkspaceIdsForUser, resolveWorkspace } = require("./workspaceService");
const {
  getStarredBoardIdSet,
  getRecentViewMap,
  toggleUserBoardStar,
  recordBoardView,
} = require("./boardUserPrefsService");
const { boardToListItem } = require("../utils/boardDto");

async function ensureUserBoardAccess(userId, boardId) {
  const wsIds = await getWorkspaceIdsForUser(userId);
  const board = await Board.findById(boardId);
  if (!board || board.is_archived) return { board: null, ok: false };
  if (!wsIds.includes(board.workspace_id)) return { board: null, ok: false };
  return { board, ok: true };
}

async function listBoardsWithMeta(userId) {
  const wsIds = await getWorkspaceIdsForUser(userId);
  if (wsIds.length === 0) return [];
  const workspaces = await Workspace.find({
    _id: { $in: wsIds },
    deleted_at: null,
  });
  const wsName = Object.fromEntries(workspaces.map((w) => [w._id, w.name]));
  const boards = await Board.find({
    workspace_id: { $in: wsIds },
    is_archived: false,
  }).sort({ updated_at: -1, created_at: 1 });
  const starSet = await getStarredBoardIdSet(userId);
  const recentMap = await getRecentViewMap(userId);
  return boards.map((b) => {
    const starred = starSet.has(b._id) || b.is_starred;
    const last_viewed_at = recentMap.get(b._id);
    return {
      ...boardToListItem(b, wsName[b.workspace_id] || "", {
        starred,
        last_viewed_at,
      }),
      workspace_id: b.workspace_id,
    };
  });
}

async function createBoardForUser(userId, { name, background, workspace_id }) {
  const user = await User.findById(userId);
  if (!user) return { error: "unauthorized", board: null, workspace: null };
  const workspace = await resolveWorkspace(userId, workspace_id || null);
  if (!workspace) return { error: "no_workspace", board: null, workspace: null };
  const { coverUrlFromTheme } = require("../utils/boardDto");
  const board = await Board.create({
    workspace_id: workspace._id,
    name,
    visibility: "workspace",
    created_by: user._id,
    cover_url: coverUrlFromTheme(background),
    is_starred: false,
  });
  await BoardMember.create({
    board_id: board._id,
    user_id: user._id,
    role: "admin",
  });
  return { error: null, board, workspace };
}

async function archiveBoard(userId, boardId) {
  const { board, ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok || !board) return { ok: false, board: null };
  board.is_archived = true;
  board.archived_at = new Date();
  await board.save();
  return { ok: true, board };
}

async function toggleStar(userId, boardId) {
  const { board, ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok || !board) return { ok: false, board: null, starred: null };
  const starred = await toggleUserBoardStar(userId, board._id);
  const workspace = await Workspace.findById(board.workspace_id);
  return { ok: true, board, workspace, starred };
}

async function recordView(userId, boardId) {
  const { board, ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok || !board) return { ok: false };
  await recordBoardView(userId, board._id);
  return { ok: true };
}

/** CRUD — đọc một bảng (raw document). */
async function getBoardById(boardId) {
  return Board.findById(boardId);
}

/** CRUD — cập nhật tên/mô tả (member workspace). */
async function updateBoard(userId, boardId, { name, description }) {
  const { board, ok } = await ensureUserBoardAccess(userId, boardId);
  if (!ok || !board) return { ok: false, board: null };
  if (name !== undefined) board.name = String(name).trim();
  if (description !== undefined) board.description = description;
  await board.save();
  return { ok: true, board };
}

module.exports = {
  ensureUserBoardAccess,
  listBoardsWithMeta,
  createBoardForUser,
  archiveBoard,
  toggleStar,
  recordView,
  getBoardById,
  updateBoard,
};
