const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const authRoutes = require("./auth.routes");
const workspaceRoutes = require("./workspace.routes");
const boardRoutes = require("./board.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workspaces", authMiddleware, workspaceRoutes);
router.use("/boards", boardRoutes);

module.exports = router;
