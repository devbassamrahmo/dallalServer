// routes/authRoutes.js

const express = require("express");
const {
  register,
  login,
  sendPasswordResetCode,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationCode,
} = require("../controllers/userController");

const router = express.Router();

// تسجيل حساب جديد
router.post("/register", register);

// تسجيل الدخول (email / phone / username / identifier + password)
router.post("/login", login);

// إرسال كود استعادة كلمة المرور
router.post("/password/reset-code", sendPasswordResetCode);

// تأكيد تغيير كلمة المرور
router.post("/password/reset", confirmPasswordReset);

// تفعيل الإيميل
router.post("/verify-email", verifyEmail);

// إعادة إرسال كود التفعيل
router.post("/verify-email/resend", resendVerificationCode);

module.exports = router;
