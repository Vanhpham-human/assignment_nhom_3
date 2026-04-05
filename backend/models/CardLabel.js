const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const cardLabelSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    card_id: { type: String, ref: "Card", required: true },
    label_id: { type: String, ref: "Label", required: true },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "card_labels", timestamps: false }
);

cardLabelSchema.index({ card_id: 1, label_id: 1 }, { unique: true });

module.exports = mongoose.model("CardLabel", cardLabelSchema);
