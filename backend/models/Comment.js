const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const commentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    card_id: { type: String, ref: "Card", required: true },
    user_id: { type: String, ref: "User", required: true },
    content: { type: String, required: true },
    deleted_at: { type: Date },
  },
  {
    collection: "comments",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Comment", commentSchema);
