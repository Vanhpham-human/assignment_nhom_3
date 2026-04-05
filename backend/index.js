require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("./models");

const Board = require("./models/Board");
const User = require("./models/User");
const Workspace = require("./models/Workspace");
const BoardMember = require("./models/BoardMember");
const { boardToListItem, coverUrlFromTheme } = require("./dto/boardDto");
const { seedIfEmpty } = require("./seed");
const { authMiddleware, signUserToken } = require("./middleware/auth");
const {
  getWorkspaceIdsForUser,
  resolveWorkspace,
  listWorkspacesForUser,
} = require("./services/userContext");
const { createWorkspaceForUser } = require("./auth/bootstrapWorkspace");
const {
  getStarredBoardIdSet,
  toggleUserBoardStar,
  recordBoardView,
  getRecentViewMap,
} = require("./services/boardUserPrefs");

const PORT = Number(process.env.API_PORT || process.env.PORT) || 3000;

function withDefaultDb(uri, dbName = "trello_boards") {
  const u = ((uri && uri.trim()) || "mongodb://localhost:27017/").replace(/\s/g, "");
  const m = u.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(\/([^?]*))?(\?.*)?$/);
  if (!m) return u;
  const origin = m[1];
  const afterSlash = m[3] !== undefined ? m[3] : "";
  const query = m[4] || "";
  if (afterSlash === "") {
    return `${origin}/${dbName}${query}`;
  }
  return u;
}

const MONGODB_URI = withDefaultDb(process.env.MONGODB_URI);

function userPublic(u) {
  return {
    id: u._id,
    email: u.email,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  };
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected:", MONGODB_URI);
  await seedIfEmpty();

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

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
      const exists = await User.findOne({ email });
      if (exists) {
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
      const token = signUserToken(user._id);
      res.status(201).json({ token, user: userPublic(user) });
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
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
      }
      user.last_login_at = new Date();
      await user.save();
      const token = signUserToken(user._id);
      res.json({ token, user: userPublic(user) });
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
      const list = await listWorkspacesForUser(req.userId);
      res.json(
        list.map((w) => ({
          _id: w._id,
          name: w.name,
          slug: w.slug,
        }))
      );
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get("/api/boards", authMiddleware, async (req, res) => {
    try {
      const wsIds = await getWorkspaceIdsForUser(req.userId);
      if (wsIds.length === 0) {
        return res.json([]);
      }
      const workspaces = await Workspace.find({
        _id: { $in: wsIds },
        deleted_at: null,
      });
      const wsName = Object.fromEntries(workspaces.map((w) => [w._id, w.name]));
      const boards = await Board.find({
        workspace_id: { $in: wsIds },
        is_archived: false,
      }).sort({ updated_at: -1, created_at: 1 });
      const starSet = await getStarredBoardIdSet(req.userId);
      const recentMap = await getRecentViewMap(req.userId);
      res.json(
        boards.map((b) => {
          const starred = starSet.has(b._id) || b.is_starred;
          const last_viewed_at = recentMap.get(b._id);
          return {
            ...boardToListItem(b, wsName[b.workspace_id] || "", {
              starred,
              last_viewed_at,
            }),
            workspace_id: b.workspace_id,
          };
        })
      );
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post("/api/boards", authMiddleware, async (req, res) => {
    try {
      const { title, background, name, workspace_id } = req.body;
      const boardName = String(name || title || "").trim();
      if (!boardName) {
        return res.status(400).json({ error: "Tên bảng là bắt buộc" });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const workspace = await resolveWorkspace(req.userId, workspace_id || null);
      if (!workspace) {
        return res.status(400).json({ error: "Không tìm thấy không gian làm việc" });
      }
      const board = await Board.create({
        workspace_id: workspace._id,
        name: boardName,
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
      res.status(201).json(
        boardToListItem(board, workspace.name)
      );
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch("/api/boards/:id/star", authMiddleware, async (req, res) => {
    try {
      const wsIds = await getWorkspaceIdsForUser(req.userId);
      const board = await Board.findById(req.params.id);
      if (!board || !wsIds.includes(board.workspace_id)) {
        return res.status(404).json({ error: "Not found" });
      }
      const starred = await toggleUserBoardStar(req.userId, board._id);
      const workspace = await Workspace.findById(board.workspace_id);
      res.json(
        boardToListItem(board, workspace?.name || "", {
          starred,
        })
      );
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  /** Ghi nhận mở bảng — dùng cho “Đã xem gần đây” (giống Trello). */
  app.post("/api/boards/:id/view", authMiddleware, async (req, res) => {
    try {
      const wsIds = await getWorkspaceIdsForUser(req.userId);
      const board = await Board.findById(req.params.id);
      if (!board || !wsIds.includes(board.workspace_id) || board.is_archived) {
        return res.status(404).json({ error: "Not found" });
      }
      await recordBoardView(req.userId, board._id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.delete("/api/boards/:id", authMiddleware, async (req, res) => {
    try {
      const wsIds = await getWorkspaceIdsForUser(req.userId);
      const board = await Board.findById(req.params.id);
      if (!board || !wsIds.includes(board.workspace_id)) {
        return res.status(404).json({ error: "Not found" });
      }
      board.is_archived = true;
      board.archived_at = new Date();
      await board.save();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
