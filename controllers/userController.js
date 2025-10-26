// controllers/userController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { normalizePhoneToDigits } = require("../utils/phone");
const { sendEmail } = require("../utils/email"); // ✅ Resend wrapper (CommonJS)

require("dotenv").config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = "24h";

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, phoneNumber: user.phoneNumber, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function generate6Digit() {
  return Math.floor(100000 + Math.random() * 900000);
}

/* =====================
   1) Register (PIN-only) -> send OTP via Resend
   ===================== */
const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, phoneNumber, pin6 } = req.body;

    if (!username || !phoneNumber || !pin6 || !email)
      return res.status(400).json({ message: "جميع الحقول مطلوبة." });

    if (!/^\d{6}$/.test(String(pin6)))
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const emailLC = String(email).trim().toLowerCase();
    const usernameLC = String(username).trim().toLowerCase();
    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    // تفرد
    if (await User.findOne({ email: emailLC })) {
      return res.status(400).json({ message: "البريد الإلكتروني مستخدم مسبقًا." });
    }
    if (await User.findOne({ phoneNumber: phoneDigits })) {
      return res.status(400).json({ message: "رقم الهاتف مستخدم مسبقًا." });
    }
    if (await User.findOne({ username: usernameLC })) {
      return res.status(400).json({ message: "اسم المستخدم مستخدم مسبقًا." });
    }

    // تشفير الـ PIN
    const hashedPin = await bcrypt.hash(String(pin6), SALT_ROUNDS);

    // إنشاء
    const newUser = new User({
      firstname,
      lastname,
      username: usernameLC,
      email: emailLC,
      phoneNumber: phoneDigits,
      pin6: hashedPin,
      isVerified: false,
    });
    await newUser.save();

    // OTP
    const otp = generate6Digit();
    newUser.otp = otp;
    newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();

    // إرسال عبر Resend
    await sendEmail(
      emailLC,
      "رمز التحقق - Dallal",
      `<p>رمز التحقق لتفعيل حسابك هو: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`
    );

    res.status(201).json({
      message: "تم إنشاء الحساب، تحقق من بريدك الإلكتروني لإدخال رمز التفعيل.",
    });
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

    const emailLC = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailLC });
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

    const emailLC = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailLC });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });
    if (user.isVerified) return res.status(400).json({ message: "الحساب موثّق مسبقًا." });

    const otp = generate6Digit();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
      "رمز التحقق الجديد - Dallal",
      `<p>رمز التحقق الجديد: <b>${otp}</b></p><p>صالح 10 دقائق.</p>`
    );

    res.status(200).json({ message: "تم إرسال OTP جديد إلى بريدك." });
  } catch (err) {
    console.error("resendOtp error:", err);
    res.status(500).json({ message: "خطأ أثناء إعادة إرسال OTP", error: err.message });
  }
};

/* =====================
   5) Login with PIN (phoneNumber + pin6) مع القفل المؤقت
   ===================== */
const loginWithPin = async (req, res) => {
  try {
    const { phoneNumber, pin6 } = req.body;

    if (!phoneNumber || !pin6)
      return res.status(400).json({ message: "رقم الهاتف و PIN مطلوبان." });

    if (!/^\d{6}$/.test(String(pin6)))
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);

    const user = await User.findOne({ phoneNumber: phoneDigits })
      .select("+pin6 username role phoneNumber failedLoginAttempts lockedUntil");

    if (!user)
      return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل أولاً." });

    if (!user.pin6)
      return res.status(400).json({ message: "لا يوجد PIN مضبوط لهذا الحساب." });

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMin = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `الحساب مقفول مؤقتًا. حاول بعد ${remainingMin} دقيقة.` });
    }

    const isMatch = await bcrypt.compare(String(pin6), user.pin6);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      const remaining = 5 - user.failedLoginAttempts;
      if (remaining > 0) {
        return res.status(401).json({ message: `PIN غير صحيح. تبقى ${remaining} محاولات قبل القفل.` });
      }
      return res.status(423).json({ message: "تم قفل الحساب مؤقتًا لمدة 15 دقيقة بسبب محاولات متكررة." });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const userData = user.toObject();
    delete userData.pin6;
    delete userData.failedLoginAttempts;
    delete userData.lockedUntil;

    return res.status(200).json({ message: "تم تسجيل الدخول بنجاح ✅", user: userData, token });
  } catch (err) {
    console.error("loginWithPin error:", err);
    return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول.", error: err.message });
  }
};

/* =====================
   6) Set PIN for existing user
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
    user.isVerified = true;
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
   7) Register with phone
   ===================== */
const registerWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username, pin6 } = req.body;
    if (!phoneNumber || !username || !pin6) return res.status(400).json({ message: "phoneNumber, username, pin6 مطلوبين." });
    if (!/^\d{6}$/.test(String(pin6))) return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const usernameLC = String(username).trim().toLowerCase();

    if (await User.findOne({ phoneNumber: phoneDigits })) {
      return res.status(409).json({ message: "رقم الهاتف مسجل مسبقًا." });
    }
    if (await User.findOne({ username: usernameLC })) {
      return res.status(409).json({ message: "اسم المستخدم محجوز." });
    }

    const hashedPin = await bcrypt.hash(String(pin6), SALT_ROUNDS);

    const user = new User({
      username: usernameLC,
      phoneNumber: phoneDigits,
      pin6: hashedPin,
      isVerified: true
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
   8) Forgot password -> send reset link (still supported)
   ===================== */
const sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email مطلوب." });

    const emailLC = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailLC });
    if (!user) {
      return res.status(200).json({ message: "إذا كان هناك حساب مرتبط فسوف يصلك رابط لإعادة التعيين." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.FRONTEND_BASE_URL || "https://sy-dallal.sy"}/reset-password/${token}`;

    await sendEmail(
      user.email,
      "طلب إعادة تعيين كلمة المرور",
      `<p>اضغط الرابط لإعادة تعيين كلمة المرور (صالح 60 دقيقة):</p><p><a href="${resetLink}">${resetLink}</a></p>`
    );

    res.status(200).json({ message: "إذا كان هناك حساب مرتبط فسوف يصلك رابط لإعادة التعيين." });
  } catch (err) {
    console.error("sendResetLink error:", err);
    res.status(500).json({ message: "خطأ أثناء إرسال رابط إعادة التعيين", error: err.message });
  }
};

/* =====================
   9) Reset password with token
   ===================== */
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "token و newPassword مطلوبين." });
    if (newPassword.length < 8) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 حروف على الأقل." });

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
   10) checkPhone flow
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

/* =====================
   11) Reset PIN by link (email)
   ===================== */
const sendPinResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email مطلوب." });

    const emailLC = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailLC });
    if (!user) return res.status(200).json({ message: "إن وُجد حساب سنرسل رابط إعادة ضبط PIN." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const link = `${process.env.FRONTEND_BASE_URL || "https://sy-dallal.sy"}/reset-pin/${token}`;

    await sendEmail(
      user.email,
      "إعادة ضبط PIN - Dallal",
      `<p>اضغط للرابط لضبط PIN جديد (صالح 60 دقيقة):</p><p><a href="${link}">${link}</a></p>`
    );

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
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    await user.save();

    res.status(200).json({ message: "تم ضبط PIN بنجاح." });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء ضبط PIN", error: err.message });
  }
};

/* =====================
   12) Set PIN during login using OTP (for legacy users)
   ===================== */
const requestSetPinOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("+email otp otpExpires pin6");
    if (!user) return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل." });
    if (user.pin6) return res.status(400).json({ message: "تم ضبط PIN مسبقًا. استخدم تسجيل الدخول." });
    if (!user.email) return res.status(400).json({ message: "لا يوجد بريد إلكتروني مرتبط بالحساب. تواصل مع الدعم." });

    const otp = generate6Digit();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
      "رمز التحقق لضبط PIN - Dallal",
      `<p>رمز التحقق لضبط PIN الخاص بحسابك: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`
    );

    return res.status(200).json({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني." });
  } catch (err) {
    console.error("requestSetPinOtp error:", err);
    return res.status(500).json({ message: "حدث خطأ أثناء إرسال رمز التحقق.", error: err.message });
  }
};

const setPinWithOtp = async (req, res) => {
  try {
    const { phoneNumber, pin6, otp } = req.body;
    if (!phoneNumber || !pin6 || !otp)
      return res.status(400).json({ message: "phoneNumber و pin6 و otp مطلوبين." });

    if (!/^\d{6}$/.test(String(pin6)))
      return res.status(400).json({ message: "PIN يجب أن يكون 6 أرقام." });

    const phoneDigits = normalizePhoneToDigits(phoneNumber);
    const user = await User.findOne({ phoneNumber: phoneDigits }).select("+otp otpExpires pin6 email username role");
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود." });
    if (user.pin6) return res.status(400).json({ message: "الـ PIN مضبوط مسبقًا. استخدم تسجيل الدخول." });

    if (!user.otp || !user.otpExpires || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: "رمز التحقق منتهي أو غير صالح. اطلب رمزًا جديدًا." });
    }
    if (Number(otp) !== Number(user.otp)) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح." });
    }

    user.pin6 = await bcrypt.hash(String(pin6), SALT_ROUNDS);
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

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

  // Phone flows
  loginWithPin,
  registerWithPhone,
  setPinForPhone,
  checkPhone,

  // Reset password
  sendResetLink,
  resetPasswordWithToken,

  // Reset PIN
  sendPinResetLink,
  resetPinWithToken,

  // Legacy set-pin during login
  setPinWithOtp,
  requestSetPinOtp,
};
