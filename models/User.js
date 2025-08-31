const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: { type: String }, // اختياري
  lastname: { type: String },  // اختياري
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true }, // اختياري
  password: { type: String }, // اختياري
  phoneNumber: { type: String, required: true, unique: true },

  isVerified: { type: Boolean, default: false },
  otp: { type: Number },
  otpExpires: { type: Date },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  resetToken: { type: String },
  resetTokenExpires: { type: Date },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
