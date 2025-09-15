const User = require("../models/User");
const Ad = require("../models/Ad");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const twilio = require("twilio");

const saltRounds = 10;
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  // const registerUser = async (req, res) => {
  //   try {
  //     const { firstname, lastname, username, email, password, phoneNumber } = req.body;
  
  //     const existingUser = await User.findOne({ email });
  //     if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });
  
  //     const hashedPassword = await bcrypt.hash(password, saltRounds);
  //     const otpCode = Math.floor(100000 + Math.random() * 900000); // Generate OTP
  
  //     // Set OTP expiration to 5 minutes from now (300000ms)
  //     const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry time
  
  //     const newUser = new User({
  //       firstname, lastname, username, email, password: hashedPassword, phoneNumber,
  //       otp: otpCode,
  //       otpExpires: otpExpires // Set the OTP expiry time
  //     });
  
  //     await newUser.save();
  
  //     // Send OTP via email
  //     const mailOptions = {
  //       from: process.env.EMAIL_USER,
  //       to: email,
  //       subject: "رمز التحقق OTP من دلال",
  //       text: `كود التحقق الخاص بك هو: ${otpCode}`
  //     };
  //     await transporter.sendMail(mailOptions);
  
  //     // Set timeout to delete the user if OTP is not verified within 5 minutes
  //     setTimeout(async () => {
  //       const userInDb = await User.findOne({ email });
  //       if (userInDb && !userInDb.isVerified && new Date() > userInDb.otpExpires) {
  //         await User.deleteOne({ email }); // Delete user if OTP expired without verification
  //         console.log("User deleted due to OTP expiration");
  //       }
  //     }, 5 * 60 * 1000); // 5 minutes timeout (300,000ms)
  
  //     res.status(201).json({ message: "تم تسجيل الحساب بنجاح، تحقق من بريدك الإلكتروني لإدخال كود OTP" });
  //   } catch (error) {
  //     res.status(500).json({ message: "خطأ أثناء التسجيل", error: error.message });
  //   }
  // };
  
  const registerUser = async (req, res) => {
    try {
      const { firstname, lastname, username, email, password, phoneNumber } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "المستخدم مسجل مسبقًا" });
  
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const newUser = new User({
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        isVerified: true 
        // otp: otpCode,               
        // otpExpires: otpExpires      
      });
  
      await newUser.save();
  
      /*
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "رمز التحقق OTP من دلال",
        text: `كود التحقق الخاص بك هو: ${otpCode}`
      };
      await transporter.sendMail(mailOptions);
      */
  
      /*
      setTimeout(async () => {
        const userInDb = await User.findOne({ email });
        if (userInDb && !userInDb.isVerified && new Date() > userInDb.otpExpires) {
          await User.deleteOne({ email });
          console.log("User deleted due to OTP expiration");
        }
      }, 5 * 60 * 1000);
      */
  
      res.status(201).json({ message: "تم تسجيل الحساب بنجاح" });
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

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000; // صالح لمدة ساعة
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

const loginOrRegisterWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username } = req.body;
    console.log(req.body)

    if (!phoneNumber) {
      return res.status(400).json({ message: "رقم الهاتف مطلوب" });
    }

    // ✅ تنسيق رقم الهاتف (يُضاف رمز البلد تلقائيًا إذا غير موجود)
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+963${phoneNumber.replace(/^0+/, "")}`; // يشيل الصفر من بداية الرقم إذا موجود

    // ✅ بحث عن المستخدم
    let user = await User.findOne({ phoneNumber: formattedPhone });

    // ✅ توليد OTP ووقت انتهاء الصلاحية
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق

    if (user) {
      // ✅ مستخدم موجود - تحديث OTP
      user.otp = otpCode;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // ✅ مستخدم جديد - تأكد من وجود اسم مستخدم
      if (!username) {
        return res.status(200).json({
          message: "المستخدم غير موجود. يرجى إدخال اسم مستخدم لإنشاء حساب جديد.",
          requiresUsername: true
        });
      }

      user = new User({
        username,
        phoneNumber: formattedPhone,
        otp: otpCode,
        otpExpires,
        isVerified: false
      });

      await user.save();
    }

    // ✅ إرسال الرسالة عبر Twilio
    await twilioClient.messages.create({
      body: `رمز التحقق الخاص بك في دلال هو: ${otpCode}`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    res.status(200).json({ message: "تم إرسال كود التحقق بنجاح", userId: user._id });
  } catch (error) {
    console.error("خطأ في loginOrRegisterWithPhone:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إرسال كود التحقق", error: error.message });
  }
};


const verifyOTPByPhone = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    if (user.isVerified) return res.status(400).json({ message: "المستخدم مفعل بالفعل" });

    if (user.otp !== otp) return res.status(400).json({ message: "رمز التحقق غير صحيح" });

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "انتهت صلاحية رمز التحقق" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    // إنشاء توكن JWT بعد التحقق
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await user.save();

    const { password, ...userData } = user.toObject();

    res.status(200).json({ message: "تم التحقق من الرقم وتسجيل الدخول", user: userData, token });
  } catch (error) {
    console.error("خطأ أثناء التحقق من OTP:", error);
    res.status(500).json({ message: "خطأ أثناء التحقق", error: error.message });
  }
};

const normalizePhone = (raw) => {
  if (!raw) return raw;
  const only = String(raw).replace(/\D/g, "");
  if (String(raw).startsWith("+")) return raw;
  // مثال: سوريا 09xxxxxxxx → +963xxxxxxxx
  if (only.startsWith("09")) return `+963${only.slice(1)}`;
  // مثال عام: إن كان الرقم بلا +
  return `+${only}`;
};

/** 1) فحص رقم الهاتف فقط */
const checkPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

    const formattedPhone = normalizePhone(phoneNumber);
    const user = await User.findOne({ phoneNumber: formattedPhone });

    if (user) {
      return res.status(200).json({
        status: "EXISTS",
        requiresPassword: true,
        message: "الرقم موجود. يرجى إدخال الرمز السري (6 أرقام)."
      });
    }

    return res.status(200).json({
      status: "NOT_FOUND",
      requiresUsername: true,
      requiresPassword: true,
      message: "الرقم غير موجود. يرجى إدخال اسم مستخدم ورمز سري (6 أرقام) للتسجيل."
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء فحص الرقم", error: err.message });
  }
};

/** 2) تسجيل مستخدم جديد: phone + username + pin(6) */
const registerWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username, password } = req.body;

    if (!phoneNumber || !username || !password) {
      return res.status(400).json({ message: "رقم الهاتف واسم المستخدم والرمز السري مطلوبة" });
    }

    if (!/^\d{6}$/.test(String(password))) {
      return res.status(400).json({ message: "الرمز السري يجب أن يكون 6 أرقام" });
    }

    const formattedPhone = normalizePhone(phoneNumber);

    const exists = await User.findOne({ phoneNumber: formattedPhone });
    if (exists) {
      return res.status(409).json({ message: "رقم الهاتف مسجل مسبقًا. استخدم تسجيل الدخول." });
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(409).json({ message: "اسم المستخدم مستخدم مسبقًا" });
    }

    const hashed = await bcrypt.hash(String(password), saltRounds);

    const user = await User.create({
      username,
      phoneNumber: formattedPhone,
      password: hashed,
      isVerified: true, // نعتبره مفعّل لأننا لا نستخدم OTP
    });

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userData } = user.toObject();
    res.status(201).json({ message: "تم إنشاء الحساب وتسجيل الدخول", user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء التسجيل عبر الهاتف", error: err.message });
  }
};

/** 3) تسجيل الدخول: phone + pin(6) */
const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: "رقم الهاتف والرمز السري مطلوبان" });
    }

    if (!/^\d{6}$/.test(String(password))) {
      return res.status(400).json({ message: "الرمز السري يجب أن يكون 6 أرقام" });
    }

    const formattedPhone = normalizePhone(phoneNumber);
    const user = await User.findOne({ phoneNumber: formattedPhone });
    if (!user) return res.status(404).json({ message: "الرقم غير موجود. الرجاء التسجيل." });

    if (!user.password) return res.status(400).json({ message: "لا يوجد رمز سري مسجّل لهذا الحساب" });

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "الرمز السري غير صحيح" });

    const token = jwt.sign(
      { id: user._id, username: user.username, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({ message: "تم تسجيل الدخول", user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء تسجيل الدخول عبر الهاتف", error: err.message });
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
  resendOTP,
  getUserAds,
  logout,
  sendResetLink,
  resetPasswordWithToken,
  loginOrRegisterWithPhone,
  verifyOTPByPhone,
  loginWithPhone,
  registerWithPhone,
  checkPhone
};

