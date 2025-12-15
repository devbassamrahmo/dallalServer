// routes/authRoutes.js

const express = require("express");
const {
  register,
  login,
  sendPasswordResetCode,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationCode,
  registerClassic,
loginClassic,
forgotPasswordByCode,
resetPasswordByCode
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

router.post("/classic/register", registerClassic);         // body: { username, email, phoneNumber, password, firstname?, lastname? }
router.post("/classic/login", loginClassic);               // body: { email, password }
router.post("/classic/password/forgot", forgotPasswordByCode); // body: { email }
router.post("/classic/password/reset", resetPasswordByCode);   // body: { email, code, newPassword }

module.exports = router;
