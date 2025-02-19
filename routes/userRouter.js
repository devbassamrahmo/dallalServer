const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
   verifyOTP,
    resendOTP
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
router.use(cors());

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP); 
router.post("/resend-otp", resendOTP);  
router.post("/login", loginUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
