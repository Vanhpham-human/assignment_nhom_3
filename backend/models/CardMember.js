const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const cardMemberSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    card_id: { type: String, ref: "Card", required: true },
    user_id: { type: String, ref: "User", required: true },
    assigned_by: { type: String, ref: "User" },
    assigned_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "card_members", timestamps: false }
);

cardMemberSchema.index({ card_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("CardMember", cardMemberSchema);
