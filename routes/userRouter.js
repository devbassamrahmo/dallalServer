const express = require("express");
const router = express.Router();
const cors = require("cors");
router.use(cors());

const { protect, isAdmin } = require("../middlewares/authMiddleware");

const {
  // Email register/login
  registerUser,
  loginUser,
  // verifyOTP,      // غير مستخدم حالياً
  // resendOTP,      // غير مستخدم حالياً

  // Users & misc
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAds,
  logout,
  sendResetLink,
  resetPasswordWithToken,

  // New phone flow (no OTP)
  checkPhone,
  setPinForPhone,
  registerWithPhone,
  loginWithPhone
} = require("../controllers/userController");

/* Email (اختياري) */
router.post("/register", registerUser);
router.post("/login", loginUser);
// router.post("/verify-otp", verifyOTP);      // مؤجّل
// router.post("/resend-otp", resendOTP);      // مؤجّل

/* Reset password via email (إن رغبت) */
router.post("/send-reset-link", sendResetLink);
router.post("/reset-password-link", resetPasswordWithToken);

/* التدفق الجديد للهاتف بدون OTP */
router.post("/auth/check-phone", checkPhone);         // فحص الرقم وتحديد الحالة
router.post("/auth/set-pin", setPinForPhone);         // ضبط PIN لمستخدم موجود بدون PIN
router.post("/auth/register-phone", registerWithPhone); // مستخدم جديد: phone+username+PIN
router.post("/auth/login-phone", loginWithPhone);     // دخول: phone+PIN

/* Users Admin & Profile */
router.get("/", protect, isAdmin, getAllUsers);
router.get("/user-ads/:userId", protect, isAdmin, getUserAds);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

/* Logout (JWT) */
router.post("/logout", protect, logout);

module.exports = router;
