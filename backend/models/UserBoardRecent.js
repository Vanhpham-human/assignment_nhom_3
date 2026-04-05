const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

/** Luồng “Đã xem gần đây” giống Trello: mỗi user có lịch sử mở bảng. */
const userBoardRecentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, ref: "User", required: true },
    board_id: { type: String, ref: "Board", required: true },
    last_viewed_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "user_board_recents", timestamps: false }
);

userBoardRecentSchema.index({ user_id: 1, board_id: 1 }, { unique: true });
userBoardRecentSchema.index({ user_id: 1, last_viewed_at: -1 });

module.exports = mongoose.model("UserBoardRecent", userBoardRecentSchema);
