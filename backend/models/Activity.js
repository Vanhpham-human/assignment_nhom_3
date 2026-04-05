const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const activitySchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    workspace_id: { type: String, ref: "Workspace" },
    board_id: { type: String, ref: "Board" },
    list_id: { type: String, ref: "BoardList" },
    card_id: { type: String, ref: "Card" },
    actor_id: { type: String, ref: "User" },
    entity_type: { type: String, required: true, maxlength: 30 },
    action: { type: String, required: true, maxlength: 100 },
    old_data: { type: String },
    new_data: { type: String },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "activities", timestamps: false }
);

module.exports = mongoose.model("Activity", activitySchema);
