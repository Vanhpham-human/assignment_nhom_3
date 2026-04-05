const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const checklistItemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    checklist_id: { type: String, ref: "Checklist", required: true },
    content: { type: String, required: true, maxlength: 255 },
    position: { type: Number, required: true },
    is_completed: { type: Boolean, required: true, default: false },
    completed_by: { type: String, ref: "User" },
    completed_at: { type: Date },
  },
  {
    collection: "checklist_items",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("ChecklistItem", checklistItemSchema);
