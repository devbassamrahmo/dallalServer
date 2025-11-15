// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // معلومات شخصية (اختياري)
  firstname:   { type: String, trim: true },
  lastname:    { type: String, trim: true },

  // الهوية
  username:    { type: String, required: true, unique: true, trim: true, lowercase: true },

  // الإيميل
  email:       { type: String, unique: true, sparse: true, trim: true, lowercase: true },

  // الهاتف
  phoneNumber: { type: String, required: true, unique: true, trim: true },

  // الحماية (مشفرة بالكنترولر)
  password:    { type: String, select: false },   // هاش كلمة السر
  pin6:        { type: String, select: false },   // هاش PIN (6 أرقام)

  // توثيق الإيميل عبر OTP
  isVerified:  { type: Boolean, default: false },
  otp:         { type: Number },
  otpExpires:  { type: Date },

  // الصلاحيات
  role:        { type: String, enum: ["user", "admin"], default: "user" },

  // استعادة كلمة المرور عبر رابط
  resetToken:        { type: String },
  resetTokenExpires: { type: Date },

  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil:         { type: Date },

  // ⭐ جديد: عدد الإعلانات + توثيق البائع
  adsCount:        { type: Number, default: 0 },
  isSellerVerified:{ type: Boolean, default: false },
}, { timestamps: true });

// فهارس
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ isSellerVerified: 1 });

module.exports = mongoose.model("User", userSchema);
