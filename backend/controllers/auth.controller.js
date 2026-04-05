const userService = require("../services/userService");
const { createWorkspaceForUser } = require("../services/workspaceService");
const { signUserToken } = require("../middlewares/auth");

function userPublic(u) {
  return {
    id: u._id,
    email: u.email,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  };
}

async function register(req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const full_name = String(req.body.full_name || "").trim();
    const exists = await userService.findByEmail(email);
    if (exists) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }
    const password_hash = await userService.hashPassword(password);
    const user = await userService.createUser({ email, password_hash, full_name });
    await createWorkspaceForUser(user, {
      name: "Không gian làm việc của tôi",
      slugPrefix: "kgl",
    });
    const token = signUserToken(user._id);
    res.status(201).json({ token, user: userPublic(user) });
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
    const user = await userService.findByEmail(email);
    if (!user || user.deleted_at || user.status !== "active") {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }
    const ok = await userService.comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }
    await userService.updateLastLogin(user);
    const token = signUserToken(user._id);
    res.json({ token, user: userPublic(user) });
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
