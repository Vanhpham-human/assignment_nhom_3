const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const cardSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    board_id: { type: String, ref: "Board", required: true },
    list_id: { type: String, ref: "BoardList", required: true },
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String },
    position: { type: Number, required: true },
    priority: { type: String, required: true, default: "medium", maxlength: 20 },
    start_at: { type: Date },
    due_at: { type: Date },
    completed_at: { type: Date },
    cover_url: { type: String },
    created_by: { type: String, ref: "User", required: true },
    is_archived: { type: Boolean, required: true, default: false },
    archived_at: { type: Date },
  },
  {
    collection: "cards",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Card", cardSchema);
