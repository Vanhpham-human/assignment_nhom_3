const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const attachmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    card_id: { type: String, ref: "Card", required: true },
    uploaded_by: { type: String, ref: "User", required: true },
    file_name: { type: String, required: true, maxlength: 255 },
    file_url: { type: String, required: true },
    file_mime_type: { type: String, maxlength: 100 },
    file_size_bytes: { type: Number },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "attachments", timestamps: false }
);

module.exports = mongoose.model("Attachment", attachmentSchema);
