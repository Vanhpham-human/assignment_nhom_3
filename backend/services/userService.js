const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function findByEmail(email) {
  return User.findOne({ email });
}

async function findActiveById(id) {
  return User.findOne({ _id: id, deleted_at: null });
}

async function createUser({ email, password_hash, full_name }) {
  return User.create({
    email,
    password_hash,
    full_name,
    status: "active",
    email_verified: false,
  });
}

async function updateLastLogin(user) {
  user.last_login_at = new Date();
  await user.save();
  return user;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** CRUD mẫu — cập nhật hồ sơ (không đổi password). */
async function updateProfile(userId, { full_name, avatar_url }) {
  const user = await findActiveById(userId);
  if (!user) return null;
  if (full_name !== undefined) user.full_name = String(full_name).trim();
  if (avatar_url !== undefined) user.avatar_url = avatar_url || undefined;
  await user.save();
  return user;
}

module.exports = {
  findByEmail,
  findActiveById,
  createUser,
  updateLastLogin,
  hashPassword,
  comparePassword,
  updateProfile,
};
