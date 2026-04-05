const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const otpRequestSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, ref: "User", required: true },
    email: { type: String, required: true, maxlength: 255 },
    otp_code_hash: { type: String, required: true },
    otp_type: { type: String, required: true, default: "reset_password", maxlength: 30 },
    status: { type: String, required: true, default: "pending", maxlength: 20 },
    attempt_count: { type: Number, required: true, default: 0 },
    max_attempts: { type: Number, required: true, default: 5 },
    expires_at: { type: Date, required: true },
    used_at: { type: Date },
    created_at: { type: Date, default: Date.now, required: true },
  },
  { collection: "otp_requests", timestamps: false }
);

module.exports = mongoose.model("OtpRequest", otpRequestSchema);
