const Request = require("../models/Request");

// إنشاء طلب (يتطلب protect)
const createRequest = async (req, res) => {
  try {
    const userId = req.user?.id; // من protect
    if (!userId) return res.status(401).json({ message: "مطلوب تسجيل الدخول" });

    const {
      type,
      title,
      description,
      priceTryMin,
      priceTryMax,
      priceUsdMin,
      priceUsdMax,
      location,
      contactPhone,
      contactWhatsApp,
    } = req.body;

    if (
      !type ||
      !title ||
      !description ||
      priceTryMin == null ||
      priceTryMax == null ||
      priceUsdMin == null ||
      priceUsdMax == null
    ) {
      return res.status(400).json({ message: "النوع، العنوان، الوصف، وأسعار الليرة/الدولار مطلوبة" });
    }

    const doc = await Request.create({
      user: userId,
      type,
      title,
      description,
      priceTryMin,
      priceTryMax,
      priceUsdMin,
      priceUsdMax,
      location,
      contactPhone,
      contactWhatsApp,
    });

    res.status(201).json({ message: "تم إنشاء الطلب", data: doc });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء إنشاء الطلب", error: err.message });
  }
};

// قائمة عامة (لا تتطلب تسجيل) — ممكن تحط protect لو بدك
const listRequests = async (req, res) => {
  try {
    const {
      q, type, status, location, user, // فلاتر
      page = 1, limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (location) filter.location = location;
    if (user) filter.user = user;
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Request.countDocuments(filter),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء جلب الطلبات", error: err.message });
  }
};

// قائمة خاصة للأدمن فقط
const adminListRequests = async (req, res) => {
  try {
    const {
      q, type, status, location, user,
      page = 1, limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (location) filter.location = location;
    if (user) filter.user = user;
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Request.countDocuments(filter),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء جلب الطلبات (أدمن)", error: err.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "الطلب غير موجود" });
    res.status(200).json({ data: doc });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء جلب الطلب", error: err.message });
  }
};

// تحديث (صاحب الطلب أو أدمن)
const updateRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const id = req.params.id;

    const doc = await Request.findById(id);
    if (!doc) return res.status(404).json({ message: "الطلب غير موجود" });

    const isOwner = String(doc.user) === String(userId);
    const isAdministrator = role === "admin";
    if (!isOwner && !isAdministrator) {
      return res.status(403).json({ message: "غير مصرح بالتعديل" });
    }

    // لا تسمح بتغيير المالك من الـ API
    const forbidden = ["user", "_id", "createdAt", "updatedAt"];
    forbidden.forEach((k) => delete req.body[k]);

    Object.assign(doc, req.body);
    await doc.validate(); // يتأكد من min/max
    await doc.save();

    res.status(200).json({ message: "تم تحديث الطلب", data: doc });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء تحديث الطلب", error: err.message });
  }
};

// حذف (صاحب الطلب أو أدمن)
const deleteRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const id = req.params.id;

    const doc = await Request.findById(id);
    if (!doc) return res.status(404).json({ message: "الطلب غير موجود" });

    const isOwner = String(doc.user) === String(userId);
    const isAdministrator = role === "admin";
    if (!isOwner && !isAdministrator) {
      return res.status(403).json({ message: "غير مصرح بالحذف" });
    }

    await doc.deleteOne();
    res.status(200).json({ message: "تم حذف الطلب", data: doc });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء حذف الطلب", error: err.message });
  }
};

// طلباتي (يتطلب protect)
const listMyRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "مطلوب تسجيل الدخول" });

    const { page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Request.find({ user: userId }).sort(sort).skip(skip).limit(Number(limit)),
      Request.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ أثناء جلب طلباتك", error: err.message });
  }
};

module.exports = {
  createRequest,
  listRequests,
  adminListRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  listMyRequests,
};
