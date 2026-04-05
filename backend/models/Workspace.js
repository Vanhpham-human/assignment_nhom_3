const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const workspaceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, maxlength: 150 },
    slug: { type: String, required: true, maxlength: 180 },
    description: { type: String },
    owner_id: { type: String, ref: "User", required: true },
    visibility: { type: String, required: true, default: "private", maxlength: 20 },
    logo_url: { type: String },
    deleted_at: { type: Date },
  },
  {
    collection: "workspaces",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

workspaceSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("Workspace", workspaceSchema);
