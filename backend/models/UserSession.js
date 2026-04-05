const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const userSessionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, ref: "User", required: true },
    refresh_token_hash: { type: String, required: true },
    user_agent: { type: String },
    ip_address: { type: String, maxlength: 50 },
    is_revoked: { type: Boolean, required: true, default: false },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now, required: true },
    revoked_at: { type: Date },
  },
  { collection: "user_sessions", timestamps: false }
);

userSessionSchema.index({ refresh_token_hash: 1 }, { unique: true });

module.exports = mongoose.model("UserSession", userSessionSchema);
