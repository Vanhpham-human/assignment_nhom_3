const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function findByEmail(email) {
  return User.findOne({ email });
}

async function findActiveById(id) {
  return User.findOne({ _id: id, deleted_at: null });
}

async function findById(id) {
  return User.findById(id);
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

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

async function updateLastLogin(user) {
  user.last_login_at = new Date();
  await user.save();
  return user;
}

module.exports = {
  findByEmail,
  findActiveById,
  findById,
  createUser,
  hashPassword,
  comparePassword,
  updateLastLogin,
};
