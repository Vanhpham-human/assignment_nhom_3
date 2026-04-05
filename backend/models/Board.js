const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const boardSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    workspace_id: { type: String, ref: "Workspace", required: true },
    name: { type: String, required: true, maxlength: 150 },
    description: { type: String },
    visibility: { type: String, required: true, default: "workspace", maxlength: 20 },
    created_by: { type: String, ref: "User", required: true },
    cover_url: { type: String },
    is_starred: { type: Boolean, required: true, default: false },
    is_archived: { type: Boolean, required: true, default: false },
    archived_at: { type: Date },
  },
  {
    collection: "boards",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Board", boardSchema);
