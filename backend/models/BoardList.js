const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const boardListSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    board_id: { type: String, ref: "Board", required: true },
    name: { type: String, required: true, maxlength: 120 },
    position: { type: Number, required: true },
    is_archived: { type: Boolean, required: true, default: false },
    created_by: { type: String, ref: "User", required: true },
    archived_at: { type: Date },
  },
  {
    collection: "board_lists",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("BoardList", boardListSchema);
