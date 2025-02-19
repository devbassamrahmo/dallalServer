const User = require("../models/User");
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
  const verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
  
      if (user.isVerified) return res.status(400).json({ message: "المستخدم مفعل بالفعل" });
  
      if (user.otp !== otp) return res.status(400).json({ message: "OTP غير صحيح" });
  
      if (new Date() > user.otpExpires) return res.status(400).json({ message: "انتهت صلاحية OTP، يرجى طلب كود جديد" });
  
      user.isVerified = true;
      user.otp = null; // ✅ إزالة الكود بعد التحقق
      user.otpExpires = null;
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
  const registerUser = async (req, res) => {
    try {
      const { firstname, lastname, username, email, password, phoneNumber } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const otpCode = Math.floor(100000 + Math.random() * 900000); // ✅ توليد OTP عشوائي 6 أرقام
  
      const newUser = new User({
        firstname, lastname, username, email, password: hashedPassword, phoneNumber,
        otp: otpCode,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000) // ✅ مدة صلاحية 10 دقائق
      });
  
      await newUser.save();
  
      // ✅ إرسال OTP عبر البريد الإلكتروني
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "رمز التحقق OTP من دلال",
        text: `كود التحقق الخاص بك هو: ${otpCode}`
      };
      await transporter.sendMail(mailOptions);
  
      res.status(201).json({ message: "تم تسجيل الحساب بنجاح، تحقق من بريدك الإلكتروني لإدخال كود OTP" });
    } catch (error) {
      res.status(500).json({ message: "خطأ أثناء التسجيل", error: error.message });
    }
  };

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
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
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

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyOTP,
  resendOTP
};
