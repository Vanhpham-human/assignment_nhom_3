const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const { authMiddleware, signUserToken } = require("./middleware/auth");
const { boardToListItem, coverUrlFromTheme } = require("./lib/boardDto");

require("./models");

const User = require("./models/User");
const Workspace = require("./models/Workspace");
const WorkspaceMember = require("./models/WorkspaceMember");
const Board = require("./models/Board");
const BoardMember = require("./models/BoardMember");
const UserBoardStar = require("./models/UserBoardStar");
const UserBoardRecent = require("./models/UserBoardRecent");

function userPublic(u) {
  return {
    id: u._id,
    email: u.email,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  };
}

async function getWorkspaceIdsForUser(userId) {
  const members = await WorkspaceMember.find({
    user_id: userId,
    status: "active",
    removed_at: null,
  }).sort({ created_at: 1 });
  return [...new Set(members.map((m) => m.workspace_id))];
}

async function resolveWorkspace(userId, workspaceIdOptional) {
  const ids = await getWorkspaceIdsForUser(userId);
  if (ids.length === 0) return null;
  if (workspaceIdOptional && ids.includes(workspaceIdOptional)) {
    return Workspace.findOne({ _id: workspaceIdOptional, deleted_at: null });
  }
  return Workspace.findOne({ _id: ids[0], deleted_at: null });
}

async function createWorkspaceForUser(user, { name, slugPrefix = "ws" } = {}) {
  const displayName = name || "Không gian làm việc";
  for (let i = 0; i < 24; i += 1) {
    const slug =
      i === 0
        ? `${slugPrefix}-${randomUUID().slice(0, 10)}`
        : `${slugPrefix}-${randomUUID().slice(0, 12)}`;
    if (await Workspace.findOne({ slug })) continue;
    const ws = await Workspace.create({
      name: displayName,
      slug,
      owner_id: user._id,
      visibility: "private",
    });
    await WorkspaceMember.create({
      workspace_id: ws._id,
      user_id: user._id,
      role: "owner",
      status: "active",
      joined_at: new Date(),
    });
    return ws;
  }
  throw new Error("Could not allocate workspace slug");
}

async function getStarredBoardIdSet(userId) {
  const rows = await UserBoardStar.find({ user_id: userId }).lean();
  return new Set(rows.map((r) => r.board_id));
}

async function getRecentViewMap(userId) {
  const rows = await UserBoardRecent.find({ user_id: userId }).lean();
  const m = new Map();
  for (const r of rows) m.set(r.board_id, r.last_viewed_at);
  return m;
}

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
  const workspaces = await Workspace.find({ _id: { $in: wsIds }, deleted_at: null });
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
      ...boardToListItem(b, wsName[b.workspace_id] || "", { starred, last_viewed_at }),
      workspace_id: b.workspace_id,
    };
  });
}

function emitToBoard(app, boardId, event, payload) {
  const io = app.get("io");
  if (io && boardId) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}

function createApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true, socket: true }));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
      const password = String(req.body.password || "");
      const full_name = String(req.body.full_name || "").trim();
      if (!email || !password || !full_name) {
        return res.status(400).json({ error: "Email, mật khẩu và họ tên là bắt buộc" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Mật khẩu tối thiểu 6 ký tự" });
      }
      if (await User.findOne({ email })) {
        return res.status(400).json({ error: "Email đã được đăng ký" });
      }
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password_hash,
        full_name,
        status: "active",
        email_verified: false,
      });
      await createWorkspaceForUser(user, {
        name: "Không gian làm việc của tôi",
        slugPrefix: "kgl",
      });
      res.status(201).json({ token: signUserToken(user._id), user: userPublic(user) });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
      const password = String(req.body.password || "");
      if (!email || !password) {
        return res.status(400).json({ error: "Nhập email và mật khẩu" });
      }
      const user = await User.findOne({ email, deleted_at: null });
      if (!user || user.status !== "active") {
        return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
      }
      if (!(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
      }
      user.last_login_at = new Date();
      await user.save();
      res.json({ token: signUserToken(user._id), user: userPublic(user) });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.userId, deleted_at: null });
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      res.json({ user: userPublic(user) });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get("/api/workspaces", authMiddleware, async (req, res) => {
    try {
      const ids = await getWorkspaceIdsForUser(req.userId);
      if (ids.length === 0) return res.json([]);
      const list = await Workspace.find({ _id: { $in: ids }, deleted_at: null }).sort({
        created_at: 1,
      });
      res.json(list.map((w) => ({ _id: w._id, name: w.name, slug: w.slug })));
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get("/api/boards", authMiddleware, async (req, res) => {
    try {
      res.json(await listBoardsWithMeta(req.userId));
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post("/api/boards", authMiddleware, async (req, res) => {
    try {
      const boardName = String(req.body.name || req.body.title || "").trim();
      if (!boardName) {
        return res.status(400).json({ error: "Tên bảng là bắt buộc" });
      }
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const workspace = await resolveWorkspace(req.userId, req.body.workspace_id || null);
      if (!workspace) {
        return res.status(400).json({ error: "Không tìm thấy không gian làm việc" });
      }
      const board = await Board.create({
        workspace_id: workspace._id,
        name: boardName,
        visibility: "workspace",
        created_by: user._id,
        cover_url: coverUrlFromTheme(req.body.background),
        is_starred: false,
      });
      await BoardMember.create({
        board_id: board._id,
        user_id: user._id,
        role: "admin",
      });
      emitToBoard(req.app, board._id, "board:created", {
        board_id: board._id,
        workspace_id: workspace._id,
      });
      res.status(201).json(boardToListItem(board, workspace.name));
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch("/api/boards/:id/star", authMiddleware, async (req, res) => {
    try {
      const { board, ok } = await ensureUserBoardAccess(req.userId, req.params.id);
      if (!ok || !board) return res.status(404).json({ error: "Not found" });
      const starred = await toggleUserBoardStar(req.userId, board._id);
      const workspace = await Workspace.findById(board.workspace_id);
      emitToBoard(req.app, board._id, "board:star", { board_id: board._id, starred });
      res.json(boardToListItem(board, workspace?.name || "", { starred }));
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post("/api/boards/:id/view", authMiddleware, async (req, res) => {
    try {
      const { board, ok } = await ensureUserBoardAccess(req.userId, req.params.id);
      if (!ok || !board) return res.status(404).json({ error: "Not found" });
      await recordBoardView(req.userId, board._id);
      emitToBoard(req.app, board._id, "board:view", {
        board_id: board._id,
        user_id: req.userId,
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.delete("/api/boards/:id", authMiddleware, async (req, res) => {
    try {
      const { board, ok } = await ensureUserBoardAccess(req.userId, req.params.id);
      if (!ok || !board) return res.status(404).json({ error: "Not found" });
      board.is_archived = true;
      board.archived_at = new Date();
      await board.save();
      emitToBoard(req.app, board._id, "board:archived", { board_id: board._id });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  return app;
}

module.exports = { createApp };
