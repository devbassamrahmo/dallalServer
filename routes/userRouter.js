const express = require("express");
const router = express.Router();
const cors = require("cors");
const { protect , isAdmin} = require("../middlewares/authMiddleware");

// const { protect , isAdmin} = require("../middleware/auth");


const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyOTP,
  resendOTP,
  getUserAds,
  logout,
  sendResetLink,
  resetPasswordWithToken,
  loginOrRegisterWithPhone,
  verifyOTPByPhone,
  checkPhone,
  registerWithPhone,
  loginWithPhone,
  
} = require("../controllers/userController");
router.use(cors());

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP); 
router.post("/resend-otp", resendOTP);  
router.post("/login", loginUser);
router.get("/", protect, isAdmin , getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get('/user-ads/:userId',  protect , isAdmin, getUserAds);
router.post("/send-reset-link", sendResetLink);
router.post("/reset-password-link", resetPasswordWithToken);

// router.post('/refresh-token' , refreshToken);
router.post('/logout' , protect , logout);


router.post("/auth/phone", loginOrRegisterWithPhone); // تسجيل دخول أو إنشاء حساب برقم الهاتف
router.post("/auth/verify-otp", verifyOTPByPhone); // التحقق من الـ OTP

// 1) فحص الرقم
router.post("/auth/check-phone", checkPhone);

// 2) تسجيل حساب جديد (phone + username + pin 6)
router.post("/auth/register-phone", registerWithPhone);

// 3) تسجيل الدخول (phone + pin 6)
router.post("/auth/login-phone", loginWithPhone);

module.exports = router;
