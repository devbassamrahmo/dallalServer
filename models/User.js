const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: true }, 
  otp: { type: String },
  otpExpires: { type: Date },
  role: {type: String,enum: ['user', 'admin'],default: 'user'},
  resetToken:{type: String},
  resetTokenExpires: {type : Date},
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
