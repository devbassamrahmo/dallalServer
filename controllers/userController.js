// const User = require("../models/User");
// const Ad = require("../models/Ad");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// require("dotenv").config();
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");
// // === ألغينا OTP بالكامل، خلّي Twilio/Meta معلّقين ===
// // const twilio = require("twilio");
// // const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
// // const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
// // const { hashPin6, comparePin6 } = require("../utils/pin"); // غير مستخدم حالياً
// const { normalizePhoneToDigits /*, toE164 */ } = require("../utils/phone");

// const saltRounds = 10;

// // قد تحتاجه فقط للـ reset password عبر الإيميل
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
// });

// /* =========================
//    1) Email Register/Login (اختياري - بقي كما هو)
// ========================= */

// const registerUser = async (req, res) => {
//   try {
//     console.log(req.body)
//     const { firstname, lastname, username, email, password, phoneNumber } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });

//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     const phoneDigits = phoneNumber ? normalizePhoneToDigits(phoneNumber) : undefined;

//     const newUser = new User({
//       firstname,
//       lastname,
//       username,
//       email,
//       password: hashedPassword,
//       phoneNumber: phoneDigits,
//       isVerified: true
//     });

//     await newUser.save();
//     res.status(201).json({ message: "تم تسجيل الحساب بنجاح" });
//   } catch (error) {
//     res.status(500).json({ message: "خطأ أثناء التسجيل", error: error.message });
//   }
// };

// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) return res.status(401).json({ message: "Invalid credentials" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     const { password: _, ...userWithoutPassword } = user.toObject();
//     res.status(200).json({ message: "Login successful", user: userWithoutPassword, token });
//   } catch (error) {
//     res.status(500).json({ message: "Server error. Please try again later.", error: error.message });
//   }
// };

// /* =========================
//    2) Email OTP (غير مستخدم حالياً) — تركناه كـ comment
// ========================= */
// // const verifyOTP = async (req, res) => { ... }
// // const resendOTP = async (req, res) => { ... }

// /* =========================
//    3) Users CRUD / Ads / Logout / Reset Password
// ========================= */

// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching users", error: error.message });
//   }
// };

// const getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching user", error: error.message });
//   }
// };

// const updateUser = async (req, res) => {
//   try {
//     const { firstname, lastname, username, email, phoneNumber } = req.body;
//     const phoneDigits = phoneNumber ? normalizePhoneToDigits(phoneNumber) : undefined;

//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id,
//       { firstname, lastname, username, email, phoneNumber: phoneDigits },
//       { new: true }
//     );

//     if (!updatedUser) return res.status(404).json({ message: "User not found" });
//     res.status(200).json({ message: "User updated successfully", user: updatedUser });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error: error.message });
//   }
// };

// const deleteUser = async (req, res) => {
//   try {
//     const deletedUser = await User.findByIdAndDelete(req.params.id);
//     if (!deletedUser) return res.status(404).json({ message: "User not found" });
//     res.status(200).json({ message: "User deleted successfully", user: deletedUser });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting user", error: error.message });
//   }
// };

// const getUserAds = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const ads = await Ad.find({ user: userId });
//     if (!ads.length) return res.status(404).json({ message: "No ads found for this user" });
//     res.status(200).json(ads);
//   } catch (error) {
//     console.error("Error fetching user ads:", error);
//     res.status(500).json({ message: "Error fetching ads", error: error.message });
//   }
// };

// const logout = async (req, res) => {
//   try {
//     // لو عندك refreshToken خزّنته بالمستخدم، نظّفه هون.
//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// const sendResetLink = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

//     const token = crypto.randomBytes(32).toString("hex");
//     user.resetToken = token;
//     user.resetTokenExpires = Date.now() + 60 * 60 * 1000;
//     await user.save();

//     const resetLink = `https://sy-dallal.sy/reset-password/${token}`;
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "إعادة تعيين كلمة المرور",
//       html: `<p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور:</p><a href="${resetLink}">${resetLink}</a>`
//     });

//     res.status(200).json({ message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني" });
//   } catch (error) {
//     res.status(500).json({ message: "خطأ أثناء إرسال الرابط", error: error.message });
//   }
// };

// const resetPasswordWithToken = async (req, res) => {
//   const { token, newPassword } = req.body;
//   try {
//     const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
//     if (!user) return res.status(400).json({ message: "الرابط غير صالح أو منتهي" });

//     const hashed = await bcrypt.hash(newPassword, saltRounds);
//     user.password = hashed;
//     user.resetToken = undefined;
//     user.resetTokenExpires = undefined;
//     await user.save();

//     res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });
//   } catch (error) {
//     res.status(500).json({ message: "خطأ أثناء تغيير كلمة المرور", error: error.message });
//   }
// };

// /* =========================
//    4) التدفق الجديد (بدون OTP نهائياً)
// ========================= */

// /** A) فحص الرقم — هل موجود؟ وهل لديه PIN؟
//  *  حالات الرد:
//  *  - NEW_USER           → يوزر جديد: اطلب username + pin6 ثم استدعِ /auth/register-phone
//  *  - EXISTS_NEEDS_PIN   → رقم موجود لكن بدون PIN: اطلب pin6 ثم استدعِ /auth/set-pin
//  *  - EXISTS_HAS_PIN     → رقم موجود ومعه PIN: اطلب pin6 ثم استدعِ /auth/login-phone
//  */
// const checkPhone = async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
    
//     if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

//     const phoneDigits = normalizePhoneToDigits(phoneNumber);
    
//     const user = await User.findOne({ phoneNumber: phoneDigits }).select("_id pin6 username phoneNumber");

//     if (!user) {
//       return res.status(200).json({
//         status: "NEW_USER",
//         requiresUsername: true,
//         requiresPin: true,
//         message: "رقم جديد. الرجاء إدخال اسم مستخدم و PIN (6 أرقام) للتسجيل."
//       });
//     }

//     if (!user.pin6) {
//       return res.status(200).json({
//         status: "EXISTS_NEEDS_PIN",
//         requiresPinSetup: true,
//         message: "الرقم موجود لكن بدون PIN. الرجاء إدخال PIN (6 أرقام) لضبطه."
//       });
//     }

//     return res.status(200).json({
//       status: "EXISTS_HAS_PIN",
//       requiresPin: true,
//       message: "الرقم موجود ويملك PIN. الرجاء إدخال PIN (6 أرقام) لتسجيل الدخول."
//     });
//   } catch (err) {
//     res.status(500).json({ message: "خطأ أثناء فحص الرقم", error: err.message });
//   }
// };


// /** B) ضبط PIN (لمستخدم موجود لا يملك PIN) + إصدار JWT */
// const setPinForPhone = async (req, res) => {
//   try {
//     const { phoneNumber, pin6 } = req.body;
//     if (!phoneNumber || !pin6) {
//       return res.status(400).json({ message: "phoneNumber و pin6 مطلوبان" });
//     }
//     if (!/^\d{6}$/.test(String(pin6))) {
//       return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
//     }

//     const phoneDigits = normalizePhoneToDigits(phoneNumber);
//     const user = await User.findOne({ phoneNumber: phoneDigits }).select("+pin6 username role phoneNumber");
//     if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
//     if (user.pin6) return res.status(400).json({ message: "تم ضبط PIN مسبقًا لهذا الرقم" });

//     user.pin6 = await bcrypt.hash(String(pin6), 10);
//     user.isVerified = true;
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     const userData = user.toObject();
//     delete userData.pin6;

//     res.status(200).json({ message: "تم ضبط PIN وتسجيل الدخول", user: userData, token });
//   } catch (err) {
//     res.status(500).json({ message: "خطأ أثناء ضبط PIN", error: err.message });
//   }
// };


// /** C) تسجيل مستخدم جديد (phone + username + pin6) + JWT */
// const registerWithPhone = async (req, res) => {
//   try {
//     const { phoneNumber, username, pin6 } = req.body;
//     if (!phoneNumber || !username || !pin6) {
//       return res.status(400).json({ message: "رقم الهاتف واسم المستخدم و PIN مطلوبة" });
//     }
//     if (!/^\d{6}$/.test(String(pin6))) {
//       return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
//     }

//     const phoneDigits = normalizePhoneToDigits(phoneNumber);
//     const exists = await User.findOne({ phoneNumber: phoneDigits });
//     if (exists) return res.status(409).json({ message: "رقم الهاتف مسجل مسبقًا. استخدم تسجيل الدخول." });

//     const usernameTaken = await User.findOne({ username });
//     if (usernameTaken) return res.status(409).json({ message: "اسم المستخدم مستخدم مسبقًا" });

//     const hashed = await bcrypt.hash(String(pin6), 10);

//     const user = await User.create({
//       username,
//       phoneNumber: phoneDigits,
//       pin6: hashed,
//       isVerified: true
//     });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     const userData = user.toObject();
//     delete userData.pin6;

//     res.status(201).json({ message: "تم إنشاء الحساب وتسجيل الدخول", user: userData, token });
//   } catch (err) {
//     res.status(500).json({ message: "خطأ أثناء التسجيل عبر الهاتف", error: err.message });
//   }
// };


// /** D) تسجيل الدخول (phone + pin6) + JWT */
// const loginWithPhone = async (req, res) => {
//   try {
//     const { phoneNumber, pin6 } = req.body;
//     if (!phoneNumber || !pin6) {
//       return res.status(400).json({ message: "رقم الهاتف والـ PIN مطلوبان" });
//     }
//     if (!/^\d{6}$/.test(String(pin6))) {
//       return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام" });
//     }

//     const phoneDigits = normalizePhoneToDigits(phoneNumber);
//     // لازم نجيب pin6 لأنو select:false
//     const user = await User.findOne({ phoneNumber: phoneDigits }).select("+pin6 username role phoneNumber");
//     if (!user) return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل." });
//     if (!user.pin6) return res.status(400).json({ message: "لا يوجد PIN مضبوط لهذا الحساب" });

//     const ok = await bcrypt.compare(String(pin6), user.pin6);
//     if (!ok) return res.status(401).json({ message: "PIN غير صحيح" });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     const userData = user.toObject();
//     delete userData.pin6;

//     res.status(200).json({ message: "تم تسجيل الدخول", user: userData, token });
//   } catch (err) {
//     res.status(500).json({ message: "خطأ أثناء تسجيل الدخول عبر الهاتف", error: err.message });
//   }
// };

// module.exports = {
//   // Email
//   registerUser,
//   loginUser,
//   // verifyOTP,     // غير مستخدم حالياً
//   // resendOTP,     // غير مستخدم حالياً

//   // Users
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   getUserAds,
//   logout,

//   // Reset password (Email)
//   sendResetLink,
//   resetPasswordWithToken,

//   // New Phone Flow (لا يوجد OTP)
//   checkPhone,
//   setPinForPhone,
//   registerWithPhone,
//   loginWithPhone
// };



// controllers/authController.js
const User = require("../models/User"); // استعمل المودل اللي عطيتني
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { normalizePhoneToDigits } = require("../utils/phone");

require("dotenv").config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = "24h";

// إعداد نودميلر (Gmail app password أفضل)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.eu",
  port: process.env.SMTP_PORT || 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// transporter.verify((error, success) => {
//   if (error) console.log("❌ SMTP Connection Error:", error);
//   else console.log("✅ SMTP Server ready to send emails as", process.env.EMAIL_USER);
// });

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, phoneNumber: user.phoneNumber, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function generate6Digit() {
  return Math.floor(100000 + Math.random() * 900000); // عدد من 100000 إلى 999999
}

/* =====================
   1) Register (email + optional password or pin6) -> send OTP to email
   ===================== */
const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, password, phoneNumber, pin6 } = req.body;

    if (!username || !email || !phoneNumber) {
      return res.status(400).json({ message: "username, email, phoneNumber مطلوبين." });
    }

    // إذا بدك تطلب كلمة مرور أو PIN على الأقل:
    if (!pin6) return res.status(400).json({ message: "PIN6 مطلوب للتسجيل." });
if (!/^\d{6}$/.test(String(pin6))) return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });
newUser.pin6 = await bcrypt.hash(String(pin6), SALT_ROUNDS);

    const emailLC = String(email).toLowerCase().trim();
    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    // فحص التفرد
    if (await User.findOne({ username: username.toLowerCase().trim() })) {
      return res.status(409).json({ message: "اسم المستخدم مستخدم." });
    }
    if (await User.findOne({ email: emailLC })) {
      return res.status(409).json({ message: "الإيميل مستخدم." });
    }
    if (await User.findOne({ phoneNumber: phoneDigits })) {
      return res.status(409).json({ message: "رقم الهاتف مستخدم." });
    }

    // تحضير اليوزر
    const newUser = new User({
      firstname,
      lastname,
      username: username.toLowerCase().trim(),
      email: emailLC,
      phoneNumber: phoneDigits,
      isVerified: false // سيتم التفعيل بعد OTP
    });

    if (password) {
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      newUser.password = hashed; // بالـ model عندك الحقل اسمه password
    }

    if (pin6) {
      if (!/^\d{6}$/.test(String(pin6))) {
        return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });
      }
      const hashedPin = await bcrypt.hash(String(pin6), SALT_ROUNDS);
      newUser.pin6 = hashedPin; // الحقل موجود باسم pin6
    }

    // أنشئ OTP كعدد وخزن مع مدة انتهاء (مثال: 10 دقايق)
    const otp = generate6Digit();
    newUser.otp = otp;
    newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await newUser.save();

    // أرسل الإيميل (بالبساطة نرسل الـ OTP)
    await transporter.sendMail({
  from: process.env.EMAIL_USER,                  // لازم يضل info@sy-dallal.com
  to: emailLC,                                   // إيميل المستخدم
  subject: "رمز التحقق - Dallal",
  html: `<p>رمز التحقق لتفعيل حسابك: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`,
  replyTo: "support@sy-dallal.com"              // إن عندك بريد دعم
});

    res.status(201).json({ message: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لإدخال OTP.", userId: newUser._id });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: "خطأ أثناء التسجيل", error: err.message });
  }
};

/* =====================
   2) Verify OTP (email + code)
   ===================== */
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "email و code مطلوبين." });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: "لم يتم إصدار OTP أو انتهت صلاحيته." });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: "رمز التحقق انتهت صلاحيته." });
    }

    if (Number(code) !== Number(user.otp)) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح." });
    }

    // نجاح: فعل الحساب واحذف الـ OTP من السجل
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.pin6;

    res.status(200).json({ message: "تم تفعيل الحساب.", user: userObj, token });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: "خطأ أثناء التحقق من OTP", error: err.message });
  }
};

/* =====================
   3) Resend OTP (email)
   ===================== */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email مطلوب." });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });

    if (user.isVerified) return res.status(400).json({ message: "الحساب موثّق مسبقًا." });

    const otp = generate6Digit();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "رمز التحقق الجديد - Dallal",
      html: `<p>رمز التحقق الجديد: <b>${otp}</b></p><p>صالح 10 دقائق.</p>`
    });

    res.status(200).json({ message: "تم إرسال OTP جديد إلى بريدك." });
  } catch (err) {
    console.error("resendOtp error:", err);
    res.status(500).json({ message: "خطأ أثناء إعادة إرسال OTP", error: err.message });
  }
};

/* =====================
   4) Login with password (emailOrUsername + password)
   ===================== */
// const loginWithPassword = async (req, res) => {
//   try {
//     const { emailOrUsername, password } = req.body;
//     if (!emailOrUsername || !password) return res.status(400).json({ message: "emailOrUsername و password مطلوبين." });

//     const query = emailOrUsername.includes("@")
//       ? { email: emailOrUsername.toLowerCase().trim() }
//       : { username: emailOrUsername.toLowerCase().trim() };

//     const user = await User.findOne(query).select("+password +pin6"); // password موجود بالحقل password
//     if (!user) return res.status(401).json({ message: "بيانات الدخول غير صحيحة." });

//     if (!user.isVerified) return res.status(403).json({ message: "الحساب غير موثّق." });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ message: "بيانات الدخول غير صحيحة." });

//     const token = signToken(user);
//     const userObj = user.toObject();
//     delete userObj.password;
//     delete userObj.pin6;

//     res.status(200).json({ message: "تم تسجيل الدخول.", user: userObj, token });
//   } catch (err) {
//     console.error("loginWithPassword error:", err);
//     res.status(500).json({ message: "خطأ أثناء تسجيل الدخول", error: err.message });
//   }
// };

/* =====================
   5) Login with PIN (phoneNumber + pin6)
   ===================== */
const loginWithPin = async (req, res) => {
  try {
    const { phoneNumber, pin6 } = req.body;

    // تحقق من الإدخالات الأساسية
    if (!phoneNumber || !pin6)
      return res.status(400).json({ message: "رقم الهاتف و PIN مطلوبان." });

    if (!/^\d{6}$/.test(String(pin6)))
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    // توحيد تنسيق الرقم (اختياري، حسب util عندك)
    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    // جلب المستخدم + pin6 لأن select:false
    const user = await User.findOne({ phoneNumber: phoneDigits })
      .select("+pin6 username role phoneNumber failedLoginAttempts lockedUntil");

    if (!user)
      return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل أولاً." });

    if (!user.pin6)
      return res.status(400).json({ message: "لا يوجد PIN مضبوط لهذا الحساب." });

    // 🔒 فحص إذا الحساب مقفول مؤقتًا
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMin = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res
        .status(423)
        .json({ message: `الحساب مقفول مؤقتًا. حاول بعد ${remainingMin} دقيقة.` });
    }

    // 🧩 تحقق من الـ PIN
    const isMatch = await bcrypt.compare(String(pin6), user.pin6);

    if (!isMatch) {
      // زِد عدّاد الفشل
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // لو فشل 5 مرات، اقفل الحساب 15 دقيقة
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة
      }

      await user.save();

      const remaining = 5 - user.failedLoginAttempts;
      if (remaining > 0) {
        return res
          .status(401)
          .json({ message: `PIN غير صحيح. تبقى ${remaining} محاولات قبل القفل.` });
      } else {
        return res
          .status(423)
          .json({ message: "تم قفل الحساب مؤقتًا لمدة 15 دقيقة بسبب محاولات متكررة." });
      }
    }

    // ✅ نجاح تسجيل الدخول
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    // توليد توكن JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // تنظيف بيانات الإرجاع
    const userData = user.toObject();
    delete userData.pin6;
    delete userData.failedLoginAttempts;
    delete userData.lockedUntil;

    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح ✅",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("loginWithPin error:", err);
    return res.status(500).json({
      message: "حدث خطأ أثناء تسجيل الدخول.",
      error: err.message,
    });
  }
};


/* =====================
   6) Set PIN for existing user (phoneNumber + pin6) - used for flow where phone exists without pin
   ===================== */
const setPinForPhone = async (req, res) => {
  try {
    const { phoneNumber, pin6 } = req.body;
    if (!phoneNumber || !pin6) return res.status(400).json({ message: "phoneNumber و pin6 مطلوبين." });
    if (!/^\d{6}$/.test(String(pin6))) return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("+pin6");
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });
    if (user.pin6) return res.status(400).json({ message: "الـ PIN مضبوط مسبقًا." });

    user.pin6 = await bcrypt.hash(String(pin6), SALT_ROUNDS);
    user.isVerified = true; // خيار: ضبط PIN يعني التحقق من المستخدم
    await user.save();

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.pin6;

    res.status(200).json({ message: "تم ضبط PIN وتسجيل الدخول.", user: userObj, token });
  } catch (err) {
    console.error("setPinForPhone error:", err);
    res.status(500).json({ message: "خطأ أثناء ضبط الـ PIN", error: err.message });
  }
};

/* =====================
   7) Register with phone (phone + username + pin6) - alternative flow
   ===================== */
const registerWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username, pin6 } = req.body;
    if (!phoneNumber || !username || !pin6) return res.status(400).json({ message: "phoneNumber, username, pin6 مطلوبين." });
    if (!/^\d{6}$/.test(String(pin6))) return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    if (await User.findOne({ phoneNumber: phoneDigits })) {
      return res.status(409).json({ message: "رقم الهاتف مسجل مسبقًا." });
    }
    if (await User.findOne({ username: username.toLowerCase().trim() })) {
      return res.status(409).json({ message: "اسم المستخدم محجوز." });
    }

    const hashedPin = await bcrypt.hash(String(pin6), SALT_ROUNDS);

    const user = new User({
      username: username.toLowerCase().trim(),
      phoneNumber: phoneDigits,
      pin6: hashedPin,
      isVerified: true // لأن الهوية عبر الهاتف مقبولة هنا
    });

    await user.save();

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.pin6;
    delete userObj.password;

    res.status(201).json({ message: "تم إنشاء الحساب وتسجيل الدخول.", user: userObj, token });
  } catch (err) {
    console.error("registerWithPhone error:", err);
    res.status(500).json({ message: "خطأ أثناء التسجيل بالهاتف", error: err.message });
  }
};

/* =====================
   8) Forgot password (email) -> send reset link containing token stored in resetToken
   ===================== */
const sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email مطلوب." });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // لا نكشف إن وُجد الحساب أم لا - نرد دائماً بنجاح وهمي
    if (!user) {
      return res.status(200).json({ message: "إذا كان هناك حساب مرتبط فسوف يصلك رابط لإعادة التعيين." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 دقيقة
    await user.save();

    const resetLink = `${process.env.FRONTEND_BASE_URL || "https://sy-dallal.sy"}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "طلب إعادة تعيين كلمة المرور",
      html: `<p>اضغط الرابط لإعادة تعيين كلمة المرور (صالح 60 دقيقة):</p><p><a href="${resetLink}">${resetLink}</a></p>`
    });

    res.status(200).json({ message: "إذا كان هناك حساب مرتبط فسوف يصلك رابط لإعادة التعيين." });
  } catch (err) {
    console.error("sendResetLink error:", err);
    res.status(500).json({ message: "خطأ أثناء إرسال رابط إعادة التعيين", error: err.message });
  }
};

/* =====================
   9) Reset password with token (token + newPassword)
   ===================== */
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "token و newPassword مطلوبين." });
    if (newPassword.length < 8) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 حروف على الأقل." });

    // نبحث عن المستخدم حسب التوكن وصلاحية الانتهاء
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "الرابط غير صالح أو منتهي." });

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح." });
  } catch (err) {
    console.error("resetPasswordWithToken error:", err);
    res.status(500).json({ message: "خطأ أثناء إعادة تعيين كلمة المرور", error: err.message });
  }
};

/* =====================
   10) Utility: checkPhone flow (كما في كودك)
   ===================== */
const checkPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("_id pin6 username phoneNumber");

    if (!user) {
      return res.status(200).json({
        status: "NEW_USER",
        requiresUsername: true,
        requiresPin: true,
        message: "رقم جديد. الرجاء إدخال اسم مستخدم و PIN (6 أرقام) للتسجيل."
      });
    }

    if (!user.pin6) {
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
    console.error("checkPhone error:", err);
    res.status(500).json({ message: "خطأ أثناء فحص الرقم", error: err.message });
  }
};

const sendPinResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email مطلوب." });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // الرد محايد حتى لو الإيميل غير موجود
    if (!user) return res.status(200).json({ message: "إن وُجد حساب سنرسل رابط إعادة ضبط PIN." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // صالح ساعة
    await user.save();

    const link = `${process.env.FRONTEND_BASE_URL || "https://sy-dallal.sy"}/reset-pin/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "إعادة ضبط PIN - Dallal",
      html: `<p>اضغط للرابط لضبط PIN جديد (صالح 60 دقيقة):</p>
             <p><a href="${link}">${link}</a></p>`
    });

    res.status(200).json({ message: "إن وُجد حساب سنرسل رابط إعادة ضبط PIN." });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء إرسال رابط ضبط PIN", error: err.message });
  }
};

const resetPinWithToken = async (req, res) => {
  try {
    const { token, pin6 } = req.body;
    if (!token || !pin6) return res.status(400).json({ message: "token و pin6 مطلوبان." });
    if (!/^\d{6}$/.test(String(pin6))) return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } }).select("+pin6");
    if (!user) return res.status(400).json({ message: "الرابط غير صالح أو منتهي." });

    user.pin6 = await bcrypt.hash(String(pin6), SALT_ROUNDS);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    // (لو كنت عامل 4-ب) صفّر القفل عند ضبط PIN
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    await user.save();

    res.status(200).json({ message: "تم ضبط PIN بنجاح." });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء ضبط PIN", error: err.message });
  }
};

const requestSetPinOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    // جلب المستخدم
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("+email otp otpExpires");
    if (!user) return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل." });

    // إذا اليوزر عنده بالفعل pin6 رجّع رسالة تبين أنه لازم يستعمل login
    if (user.pin6) return res.status(400).json({ message: "تم ضبط PIN مسبقًا. استخدم تسجيل الدخول." });

    // مولّد OTP جديد (6 أرقام)
    const otp = Math.floor(100000 + Math.random() * 900000); // number
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // صالح 10 دقائق
    await user.save();

    // أرسل الإيميل (إذا الإيميل موجود)
    if (!user.email) {
      // لو ما فيه إيميل، لا نرسل ونطلب طريقة أخرى
      return res.status(400).json({ message: "لا يوجد بريد إلكتروني مرتبط بالحساب. تواصل مع الدعم." });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "رمز التحقق لضبط PIN - Dallal",
      html: `<p>رمز التحقق لضبط PIN الخاص بحسابك: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`
    });

    return res.status(200).json({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني." });
  } catch (err) {
    console.error("requestSetPinOtp error:", err);
    return res.status(500).json({ message: "حدث خطأ أثناء إرسال رمز التحقق.", error: err.message });
  }
};

// 2) ضبط PIN باستخدام OTP + إصدار JWT
const setPinWithOtp = async (req, res) => {
  try {
    const { phoneNumber, pin6, otp } = req.body;
    if (!phoneNumber || !pin6 || !otp) {
      return res.status(400).json({ message: "phoneNumber و pin6 و otp مطلوبين." });
    }
    if (!/^\d{6}$/.test(String(pin6))) {
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });
    }

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    // جلب المستخدم مع الحقول اللازمة
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("+otp otpExpires pin6 email username role");
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });

    // تأكد أن اليوزر فعلاً بدون pin (أو يمكن السماح بتغييره إن أردت)
    if (user.pin6) return res.status(400).json({ message: "الـ PIN مضبوط مسبقًا. استخدم تسجيل الدخول." });

    // تحقق من صلاحية OTP
    if (!user.otp || !user.otpExpires || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: "رمز التحقق منتهي أو غير صالح. اطلب رمزًا جديدًا." });
    }

    if (Number(otp) !== Number(user.otp)) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح." });
    }

    // كل شيء تمام: ضبّط الـ PIN كهاش، فعّل الحساب، امسح الـ otp
    user.pin6 = await bcrypt.hash(String(pin6), SALT_ROUNDS);
    user.isVerified = true; // خيار: ضبط PIN يعني التحقق
    user.otp = undefined;
    user.otpExpires = undefined;

    // لو تستخدم حقول القفل من 4-b: صفّرهم
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    await user.save();

    // اصدر JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const userObj = user.toObject();
    delete userObj.pin6;
    delete userObj.otp;
    delete userObj.otpExpires;
    delete userObj.failedLoginAttempts;
    delete userObj.lockedUntil;

    return res.status(200).json({ message: "تم ضبط PIN وتسجيل الدخول.", user: userObj, token });
  } catch (err) {
    console.error("setPinWithOtp error:", err);
    return res.status(500).json({ message: "حدث خطأ أثناء ضبط PIN.", error: err.message });
  }
};



module.exports = {
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
  setPinWithOtp,
  requestSetPinOtp
};
