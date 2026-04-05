const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

/** Giống Trello: gắn sao bảng theo từng user (không dùng chung is_starred trên board). */
const userBoardStarSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, ref: "User", required: true },
    board_id: { type: String, ref: "Board", required: true },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "user_board_stars", timestamps: false }
);

userBoardStarSchema.index({ user_id: 1, board_id: 1 }, { unique: true });

module.exports = mongoose.model("UserBoardStar", userBoardStarSchema);
