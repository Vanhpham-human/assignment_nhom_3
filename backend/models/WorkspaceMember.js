const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const workspaceMemberSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    workspace_id: { type: String, ref: "Workspace", required: true },
    user_id: { type: String, ref: "User", required: true },
    role: { type: String, required: true, default: "member", maxlength: 20 },
    status: { type: String, required: true, default: "active", maxlength: 20 },
    invited_by: { type: String, ref: "User" },
    joined_at: { type: Date },
    removed_at: { type: Date },
  },
  {
    collection: "workspace_members",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

workspaceMemberSchema.index({ workspace_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("WorkspaceMember", workspaceMemberSchema);
