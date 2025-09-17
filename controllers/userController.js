const User = require("../models/User");
const Ad = require("../models/Ad");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// === ألغينا OTP بالكامل، خلّي Twilio/Meta معلّقين ===
// const twilio = require("twilio");
// const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
// const { hashPin6, comparePin6 } = require("../utils/pin"); // غير مستخدم حالياً
const { normalizePhoneToDigits /*, toE164 */ } = require("../utils/phone");

const saltRounds = 10;

// قد تحتاجه فقط للـ reset password عبر الإيميل
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/* =========================
   1) Email Register/Login (اختياري - بقي كما هو)
========================= */

const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, password, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const phoneDigits = phoneNumber ? normalizePhoneToDigits(phoneNumber) : undefined;

    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      phoneNumber: phoneDigits,
      isVerified: true
    });

    await newUser.save();
    res.status(201).json({ message: "تم تسجيل الحساب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ أثناء التسجيل", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({ message: "Login successful", user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
  }
};

/* =========================
   2) Email OTP (غير مستخدم حالياً) — تركناه كـ comment
========================= */
// const verifyOTP = async (req, res) => { ... }
// const resendOTP = async (req, res) => { ... }

/* =========================
   3) Users CRUD / Ads / Logout / Reset Password
========================= */

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
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, phoneNumber } = req.body;
    const phoneDigits = phoneNumber ? normalizePhoneToDigits(phoneNumber) : undefined;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, username, email, phoneNumber: phoneDigits },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

const getUserAds = async (req, res) => {
  try {
    const userId = req.params.userId;
    const ads = await Ad.find({ user: userId });
    if (!ads.length) return res.status(404).json({ message: "No ads found for this user" });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching user ads:", error);
    res.status(500).json({ message: "Error fetching ads", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // لو عندك refreshToken خزّنته بالمستخدم، نظّفه هون.
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetLink = `https://sy-dallal.sy/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "إعادة تعيين كلمة المرور",
      html: `<p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.status(200).json({ message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني" });
  } catch (error) {
    res.status(500).json({ message: "خطأ أثناء إرسال الرابط", error: error.message });
  }
};

const resetPasswordWithToken = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: "الرابط غير صالح أو منتهي" });

    const hashed = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ أثناء تغيير كلمة المرور", error: error.message });
  }
};

/* =========================
   4) التدفق الجديد (بدون OTP نهائياً)
========================= */

/** A) فحص الرقم — هل موجود؟ وهل لديه PIN؟
 *  حالات الرد:
 *  - NEW_USER           → يوزر جديد: اطلب username + pin6 ثم استدعِ /auth/register-phone
 *  - EXISTS_NEEDS_PIN   → رقم موجود لكن بدون PIN: اطلب pin6 ثم استدعِ /auth/set-pin
 *  - EXISTS_HAS_PIN     → رقم موجود ومعه PIN: اطلب pin6 ثم استدعِ /auth/login-phone
 */
const checkPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits });

    if (!user) {
      return res.status(200).json({
        status: "NEW_USER",
        requiresUsername: true,
        requiresPin: true,
        message: "رقم جديد. الرجاء إدخال اسم مستخدم و PIN (6 أرقام) للتسجيل."
      });
    }

    if (!user.password) {
      return res.status(200).json({
        status: "EXISTS_NEEDS_PIN",
        requiresPinSetup: true,
        message: "الرقم موجود لكن بدون PIN. الرجاء إدخال PIN (6 أرقام) لضبطه."
      });
    }

    return res.status(200).json({
      status: "EXISTS_HAS_PIN",
      requiresPin: true,
      message: "الرقم موجود ويملك PIN. الرجاء إدخال PIN (6 أرقام) لتسجيل الدخول."
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء فحص الرقم", error: err.message });
  }
};

/** B) ضبط PIN (لمستخدم موجود لا يملك PIN) + إصدار JWT */
const setPinForPhone = async (req, res) => {
  try {
    const { phoneNumber, pin6 } = req.body;
    if (!phoneNumber || !pin6) {
      return res.status(400).json({ message: "phoneNumber و pin6 مطلوبان" });
    }
    if (!/^\d{6}$/.test(String(pin6))) {
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
    }

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    if (user.password) return res.status(400).json({ message: "تم ضبط PIN مسبقًا لهذا الرقم" });

    user.password = await bcrypt.hash(String(pin6), saltRounds); // تخزين PIN بالـ password
    user.isVerified = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password, ...userData } = user.toObject();
    res.status(200).json({ message: "تم ضبط PIN وتسجيل الدخول", user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء ضبط PIN", error: err.message });
  }
};

/** C) تسجيل مستخدم جديد (phone + username + pin6) + JWT */
const registerWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username, pin6 } = req.body;
    if (!phoneNumber || !username || !pin6) {
      return res.status(400).json({ message: "رقم الهاتف واسم المستخدم و PIN مطلوبة" });
    }
    if (!/^\d{6}$/.test(String(pin6))) {
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
    }

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const exists = await User.findOne({ phoneNumber: phoneDigits });
    if (exists) return res.status(409).json({ message: "رقم الهاتف مسجل مسبقًا. استخدم تسجيل الدخول." });

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) return res.status(409).json({ message: "اسم المستخدم مستخدم مسبقًا" });

    const hashed = await bcrypt.hash(String(pin6), saltRounds);

    const user = await User.create({
      username,
      phoneNumber: phoneDigits,
      password: hashed, // نخزّن PIN
      isVerified: true
    });

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password, ...userData } = user.toObject();
    res.status(201).json({ message: "تم إنشاء الحساب وتسجيل الدخول", user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء التسجيل عبر الهاتف", error: err.message });
  }
};

/** D) تسجيل الدخول (phone + pin6) + JWT */
const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, pin6 } = req.body;
    if (!phoneNumber || !pin6) {
      return res.status(400).json({ message: "رقم الهاتف والـ PIN مطلوبان" });
    }
    if (!/^\d{6}$/.test(String(pin6))) {
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
    }

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits });
    if (!user) return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل." });
    if (!user.password) return res.status(400).json({ message: "لا يوجد PIN مضبوط لهذا الحساب" });

    const ok = await bcrypt.compare(String(pin6), user.password);
    if (!ok) return res.status(401).json({ message: "PIN غير صحيح" });

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password, ...userData } = user.toObject();
    res.status(200).json({ message: "تم تسجيل الدخول", user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء تسجيل الدخول عبر الهاتف", error: err.message });
  }
};

module.exports = {
  // Email
  registerUser,
  loginUser,
  // verifyOTP,     // غير مستخدم حالياً
  // resendOTP,     // غير مستخدم حالياً

  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAds,
  logout,

  // Reset password (Email)
  sendResetLink,
  resetPasswordWithToken,

  // New Phone Flow (لا يوجد OTP)
  checkPhone,
  setPinForPhone,
  registerWithPhone,
  loginWithPhone
};
