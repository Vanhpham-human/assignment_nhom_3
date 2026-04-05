const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const boardMemberSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    board_id: { type: String, ref: "Board", required: true },
    user_id: { type: String, ref: "User", required: true },
    role: { type: String, required: true, default: "member", maxlength: 20 },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "board_members", timestamps: false }
);

boardMemberSchema.index({ board_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("BoardMember", boardMemberSchema);
