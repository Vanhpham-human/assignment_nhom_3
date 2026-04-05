const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const checklistSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    card_id: { type: String, ref: "Card", required: true },
    title: { type: String, required: true, maxlength: 150 },
    position: { type: Number, required: true },
    created_by: { type: String, ref: "User", required: true },
  },
  {
    collection: "checklists",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Checklist", checklistSchema);
