const express = require("express");
const router = express.Router();
const cors = require("cors");
const { protect , isAdmin} = require("../middlewares/authMiddleware");
  
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
  logout
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
router.get('/user-ads/:userId',  protect , isAdmin, getUserAds)
// router.post('/refresh-token' , refreshToken);
router.post('/logout' , protect , logout);
module.exports = router;
