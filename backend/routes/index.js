const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const authRoutes = require("./auth.routes");
const workspaceRoutes = require("./workspace.routes");
const boardRoutes = require("./board.routes");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true, socket: true }));

router.use("/auth", authRoutes);
router.use("/workspaces", authMiddleware, workspaceRoutes);
router.use("/boards", authMiddleware, boardRoutes);

module.exports = router;
