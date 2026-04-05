const userService = require("../services/userService");
const { createWorkspaceForUser } = require("../services/workspaceService");
const { signUserToken } = require("../middleware/auth");
const { userPublic } = require("../lib/userPublic");

async function register(req, res) {
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
    if (await userService.findByEmail(email)) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }
    const password_hash = await userService.hashPassword(password);
    const user = await userService.createUser({ email, password_hash, full_name });
    await createWorkspaceForUser(user, {
      name: "Không gian làm việc của tôi",
      slugPrefix: "kgl",
    });
    res.status(201).json({ token: signUserToken(user._id), user: userPublic(user) });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function login(req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Nhập email và mật khẩu" });
    }
    const user = await userService.findByEmail(email);
    if (!user || user.deleted_at || user.status !== "active") {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }
    if (!(await userService.comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }
    await userService.updateLastLogin(user);
    res.json({ token: signUserToken(user._id), user: userPublic(user) });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

async function me(req, res) {
  try {
    const user = await userService.findActiveById(req.userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ user: userPublic(user) });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

module.exports = { register, login, me };
