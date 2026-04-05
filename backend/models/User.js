const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    email: { type: String, required: true, maxlength: 255 },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true, maxlength: 150 },
    avatar_url: { type: String },
    status: { type: String, required: true, default: "active", maxlength: 20 },
    email_verified: { type: Boolean, required: true, default: false },
    last_login_at: { type: Date },
    deleted_at: { type: Date },
  },
  {
    collection: "users",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
