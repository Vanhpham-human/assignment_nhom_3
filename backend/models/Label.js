const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const labelSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    board_id: { type: String, ref: "Board", required: true },
    name: { type: String, maxlength: 80 },
    color: { type: String, required: true, maxlength: 30 },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "labels", timestamps: false }
);

module.exports = mongoose.model("Label", labelSchema);
