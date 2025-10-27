// controllers/publicController.js
const User = require("../models/User");
const Ad = require("../models/Ad");

function sanitizePublicUser(u) {
  const x = u.toObject ? u.toObject() : u;
  delete x.pin6;
  delete x.password;
  delete x.otp;
  delete x.otpExpires;
  delete x.resetToken;
  delete x.resetTokenExpires;
  delete x.failedLoginAttempts;
  delete x.lockedUntil;
  delete x.role; // اختياري: ما نعرض الدور
  // اختياري: ما تعرض الايميل/الرقم إذا بدك خصوصية
  // delete x.email;
  // delete x.phoneNumber;
  return x;
}

// GET /public/users/:idOrUsername
const getPublicUserProfile = async (req, res) => {
  try {
    const { idOrUsername } = req.params;
    const query = idOrUsername.includes("@") // قليل يصير، بس احتياط
      ? { email: idOrUsername.toLowerCase() }
      : (/^[0-9a-fA-F]{24}$/.test(idOrUsername)
          ? { _id: idOrUsername }
          : { username: idOrUsername.toLowerCase() });

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    return res.status(200).json({ user: sanitizePublicUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "خطأ بجلب البروفايل", error: err.message });
  }
};

// GET /public/users/:idOrUsername/ads?page=1&limit=20&status=active
const getPublicUserAds = async (req, res) => {
  try {
    const { idOrUsername } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const queryUser = /^[0-9a-fA-F]{24}$/.test(idOrUsername)
      ? { _id: idOrUsername }
      : { username: idOrUsername.toLowerCase() };

    const user = await User.findOne(queryUser).select("_id");
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    const adFilter = { user: user._id };
    if (status) adFilter.status = status; // مثلاً: active/draft/sold …

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Ad.find(adFilter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Ad.countDocuments(adFilter),
    ]);

    return res.status(200).json({
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      items,
    });
  } catch (err) {
    return res.status(500).json({ message: "خطأ بجلب إعلانات المستخدم", error: err.message });
  }
};

module.exports = { getPublicUserProfile, getPublicUserAds };
