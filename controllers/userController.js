const User = require("../models/User");
const Ad = require("../models/Ad");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");

const saltRounds = 10;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const registerUser = async (req, res) => {
    try {
      const { firstname, lastname, username, email, password, phoneNumber } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const otpCode = Math.floor(100000 + Math.random() * 900000); // Generate OTP
  
      // Set OTP expiration to 5 minutes from now (300000ms)
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry time
  
      const newUser = new User({
        firstname, lastname, username, email, password: hashedPassword, phoneNumber,
        otp: otpCode,
        otpExpires: otpExpires // Set the OTP expiry time
      });
  
      await newUser.save();
  
      // Send OTP via email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "رمز التحقق OTP من دلال",
        text: `كود التحقق الخاص بك هو: ${otpCode}`
      };
      await transporter.sendMail(mailOptions);
  
      // Set timeout to delete the user if OTP is not verified within 5 minutes
      setTimeout(async () => {
        const userInDb = await User.findOne({ email });
        if (userInDb && !userInDb.isVerified && new Date() > userInDb.otpExpires) {
          await User.deleteOne({ email }); // Delete user if OTP expired without verification
          console.log("User deleted due to OTP expiration");
        }
      }, 5 * 60 * 1000); // 5 minutes timeout (300,000ms)
  
      res.status(201).json({ message: "تم تسجيل الحساب بنجاح، تحقق من بريدك الإلكتروني لإدخال كود OTP" });
    } catch (error) {
      res.status(500).json({ message: "خطأ أثناء التسجيل", error: error.message });
    }
  };
  
  
  const verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
  
      if (user.isVerified) return res.status(400).json({ message: "المستخدم مفعل بالفعل" });
  
      if (user.otp !== otp) return res.status(400).json({ message: "OTP غير صحيح" });
  
      if (new Date() > user.otpExpires) {
        return res.status(400).json({ message: "انتهت صلاحية OTP، يرجى طلب كود جديد" });
      }
  
      user.isVerified = true;
      user.otp = null; // Remove OTP after verification
      user.otpExpires = null; // Remove OTP expiration time
      await user.save();
  
      res.status(200).json({ message: "تم التحقق من الحساب بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ أثناء التحقق من OTP", error: error.message });
    }
  };
  

  
  const resendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
  
      if (user.isVerified) return res.status(400).json({ message: "المستخدم مفعل بالفعل" });
  
      const otpCode = Math.floor(100000 + Math.random() * 900000); // ✅ توليد كود جديد
      user.otp = otpCode;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "إعادة إرسال OTP",
        text: `كود التحقق الجديد هو: ${otpCode}`
      };
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: "تم إرسال كود جديد إلى بريدك الإلكتروني" });
    } catch (error) {
      res.status(500).json({ message: "خطأ أثناء إعادة إرسال OTP", error: error.message });
    }
  };

  // const loginUser = async (req,res) =>{
  //   const { email, password } = req.body;

  //   try {
  //       // Check if user exists
  //       const user = await User.findOne({ email });
  //       if (!user) {
  //           return res.status(400).json({ message: "User not found" });
  //       }

  //       // Validate password
  //       const isMatch = await bcrypt.compare(password, user.password);
  //       if (!isMatch) {
  //           return res.status(400).json({ message: "Invalid credentials" });
  //       }

  //       // Generate access token
  //       const accessToken = jwt.sign(
  //           { id: user._id, role: user.role },
  //           process.env.ACCESS_TOKEN_SECRET,
  //           { expiresIn: "15m" } // Short-lived
  //       );

  //       // Generate refresh token
  //       const refreshToken = jwt.sign(
  //           { id: user._id },
  //           process.env.REFRESH_TOKEN_SECRET,
  //           { expiresIn: "7d" } // Long-lived
  //       );

  //       // Save refresh token to the database (for validation later)
  //       user.refreshToken = refreshToken;
  //       await user.save();

  //       // Send tokens to the client
  //       res.status(200).json({ accessToken, refreshToken });
  //   } catch (error) {
  //       console.error("Login error:", error);
  //       res.status(500).json({ message: "Server error", error: error.message });
  //   }
  // }
 


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, username: user.username, email : user.email , role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({ message: "Login successful", user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, phoneNumber } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, username, email, phoneNumber },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

const getUserAds = async (req , res) =>{
  try {
    const userId = req.params.userId;

    // ✅ Fetch ads by user ID
    const ads = await Ad.find({ user: userId });

    if (!ads.length) {
        return res.status(404).json({ message: 'No ads found for this user' });
    }

    res.status(200).json(ads);
} catch (error) {
    console.error('Error fetching user ads:', error);
    res.status(500).json({ message: 'Error fetching ads', error: error.message });
}
}


// const refreshToken = async (req, res) =>{
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//       return res.status(401).json({ message: "Refresh token is required" });
//   }

//   try {
//       // Verify the refresh token
//       const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

//       // Find the user in the database
//       const user = await User.findById(decoded.id);
//       if (!user || user.refreshToken !== refreshToken) {
//           return res.status(403).json({ message: "Invalid refresh token" });
//       }

//       // Issue a new access token
//       const accessToken = jwt.sign(
//           { id: user._id, role: user.role },
//           process.env.ACCESS_TOKEN_SECRET,
//           { expiresIn: "15m" }
//       );

//       // Send the new access token to the client
//       res.status(200).json({ accessToken });
//   } catch (error) {
//       console.error("Refresh token error:", error);
//       res.status(403).json({ message: "Invalid or expired refresh token" });
//   }
// }


const logout = async (req,res) =>{
  try {
    // Remove the refresh token from the user document
    req.user.refreshToken = null;
    await req.user.save();

    res.status(200).json({ message: "Logged out successfully" });
} catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
}
}
module.exports = {
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
};
