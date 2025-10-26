// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   firstname: { type: String }, // اختياري
//   lastname: { type: String },  // اختياري
//   username: { type: String, required: true, unique: true },
//   email: { type: String, unique: true, sparse: true},
//   password: { type: String }, // اختياري
//   phoneNumber: { type: String, required: true, unique: true },
  

//   pin6: { type: String, select: false }, // هاش للـ PIN 6 أرقام

//   isVerified: { type: Boolean, default: false },
//   otp: { type: Number },
//   otpExpires: { type: Date },



//   role: { type: String, enum: ['user', 'admin'], default: 'user' },

//   resetToken: { type: String },
//   resetTokenExpires: { type: Date },
// }, { timestamps: true });

// const User = mongoose.model("User", userSchema);
// module.exports = User;


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
  otp:         { type: Number },                  // كود OTP كـ رقم (كما طلبت)
  otpExpires:  { type: Date },                    // وقت انتهاء الـ OTP

  // الصلاحيات
  role:        { type: String, enum: ["user", "admin"], default: "user" },

  // استعادة كلمة المرور عبر رابط
  resetToken:        { type: String },
  resetTokenExpires: { type: Date },
}, { timestamps: true });

// فهارس للتأكّد من التفرد
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
