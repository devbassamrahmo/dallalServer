// const express = require("express");
// const router = express.Router();
// const cors = require("cors");
// router.use(cors());

// const { protect, isAdmin } = require("../middlewares/authMiddleware");

// const {
//   // Email register/login
//   registerUser,
//   loginUser,
//   // verifyOTP,      // غير مستخدم حالياً
//   // resendOTP,      // غير مستخدم حالياً

//   // Users & misc
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   getUserAds,
//   logout,
//   sendResetLink,
//   resetPasswordWithToken,

//   // New phone flow (no OTP)
//   checkPhone,
//   setPinForPhone,
//   registerWithPhone,
//   loginWithPhone
// } = require("../controllers/userController");

// /* Email (اختياري) */
// router.post("/register", registerUser);
// router.post("/login", loginUser);
// // router.post("/verify-otp", verifyOTP);      // مؤجّل
// // router.post("/resend-otp", resendOTP);      // مؤجّل

// /* Reset password via email (إن رغبت) */
// router.post("/send-reset-link", sendResetLink);
// router.post("/reset-password-link", resetPasswordWithToken);

// /* التدفق الجديد للهاتف بدون OTP */
// router.post("/auth/check-phone", checkPhone);         // فحص الرقم وتحديد الحالة
// router.post("/auth/set-pin", setPinForPhone);         // ضبط PIN لمستخدم موجود بدون PIN
// router.post("/auth/register-phone", registerWithPhone); // مستخدم جديد: phone+username+PIN
// router.post("/auth/login-phone", loginWithPhone);     // دخول: phone+PIN

// /* Users Admin & Profile */
// router.get("/", protect, isAdmin, getAllUsers);
// router.get("/user-ads/:userId", protect, isAdmin, getUserAds);
// router.get("/:id", getUserById);
// router.put("/:id", updateUser);
// router.delete("/:id", deleteUser);

// /* Logout (JWT) */
// router.post("/logout", protect, logout);

// module.exports = router;


// routes/auth.js
const express = require("express");
const router = express.Router();

// لو عامل rate limiter (اختياري)
// const rateLimit = require("express-rate-limit");
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 دقيقة
//   max: 100,                  // 100 طلب لكل IP
// });
// router.use(authLimiter);

const {
  // Email flows
  registerUser,
  verifyOtp,
  resendOtp,
  // loginWithPassword,

  // Phone flows
  loginWithPin,
  registerWithPhone,
  setPinForPhone,
  checkPhone,

  // Reset password
  sendResetLink,
  resetPasswordWithToken,
  sendPinResetLink,
  resetPinWithToken,
  requestSetPinOtp,
  setPinWithOtp,
  sendPinResetCode,
  confirmPinResetWithCode,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAds,
} = require("../controllers/userController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// ===== Register + Email OTP =====
router.post("/register", registerUser);          // body: { firstname?, lastname?, username, email, phoneNumber, password?, pin6? }
router.post("/verify-otp", verifyOtp);           // body: { email, code }
router.post("/resend-otp", resendOtp);           // body: { email }

// ===== Login (طريقتين) =====
// router.post("/login/password", loginWithPassword); // body: { emailOrUsername, password }
router.post("/login/pin", loginWithPin);           // body: { phoneNumber, pin6 }

// ===== Phone-based flows =====
router.post("/register/phone", registerWithPhone); // body: { phoneNumber, username, pin6 }
router.post("/pin/set", setPinForPhone);           // body: { phoneNumber, pin6 }
router.post("/check-phone", checkPhone);           // body: { phoneNumber }

// ===== Forgot/Reset Password =====
router.post("/password/forgot", sendResetLink);       // body: { email }
router.post("/password/reset", resetPasswordWithToken); // body: { token, newPassword }

router.post("/pin/forgot", sendPinResetLink);
router.post("/pin/reset", resetPinWithToken);

router.post("/pin/request-set", requestSetPinOtp);     // body: { phoneNumber }
router.post("/pin/set-with-otp", setPinWithOtp);       // body: { phoneNumber, pin6, otp }

// طلب كود إعادة ضبط PIN
router.post("/pin/reset/code/request", sendPinResetCode);

// تأكيد الكود وتعيين PIN جديد
router.post("/pin/reset/code/confirm", confirmPinResetWithCode);

/* Users Admin & Profile */
router.get("/", protect, isAdmin, getAllUsers);
router.get("/user-ads/:userId", protect, isAdmin, getUserAds);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

router.get("/admin/users/search", protect, isAdmin, adminSearchUser);

module.exports = router;
