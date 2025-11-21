const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitNotificationToUser, emitBroadcastPodcast } = require("../sockets/notificationSocket");

// إنشاء نوتيفيكشن لمستخدم معيّن
exports.createNotification = async ({ userId, type = "SYSTEM", title, body, data }) => {
  if (!userId || !title) throw new Error("userId و title مطلوبان");
  const notif = await Notification.create({ user: userId, type, title, body, data });

  // 🔔 إرسال real-time للمستخدم
  emitNotificationToUser(userId, notif);

  return notif;
};
// إنشاء نوتيفيكشن لمستخدم معيّن (تقدر تستخدمها من أماكن ثانية داخل السيرفر)
exports.createNotification = async ({ userId, type = "SYSTEM", title, body, data }) => {
  if (!userId || !title) throw new Error("userId و title مطلوبان");
  const notif = await Notification.create({ user: userId, type, title, body, data });
  return notif;
};

// لائحة إشعاراتي (مع pagination + فلاتر اختيارية)
exports.listMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const type = req.query.type;        // اختياري: SYSTEM/MESSAGE/AD/TRANSACTION
    const unread = req.query.unread;    // اختياري: "true" لفلترة غير المقروء

    const q = { user: userId, isDeleted: false };
    if (type) q.type = type;
    if (unread === "true") q.isRead = false;

    const [items, total] = await Promise.all([
      Notification.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(q),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    res.status(500).json({ message: "خطأ بجلب الإشعارات", error: e.message });
  }
};

// تعليم إشعار واحد كمقروء
exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const doc = await Notification.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { isRead: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "غير موجود" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

// تعليم كل إشعاراتي كمقروء
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ user: userId, isRead: false, isDeleted: false }, { isRead: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

// عدد غير المقروء
exports.unreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ user: userId, isRead: false, isDeleted: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

/**
 * توليد إشعارات تجريبية للفرونت
 * POST /notifications/seed
 * Body (اختياري): { count?: number, clean?: boolean, perUser?: number }
 * - clean: لو true يحذف كل الإشعارات أولاً
 * - count: عدد الإشعارات العامة لكل مستخدم هدف (افتراضي 3)
 * - perUser: كم مستخدم نولّده لهم (افتراضي 5 مستخدمين)
 */
exports.seedDemoNotifications = async (req, res) => {
  try {
    let { count = 3, clean = false, perUser = 5 } = req.body || {};
    count = Math.max(1, Number(count));
    perUser = Math.max(1, Number(perUser));

    if (clean === true) {
      await Notification.deleteMany({});
    }

    // جيب شوية مستخدمين (بما فيهم المستخدم الحالي لو متوفر)
    const seedUsers = await User.find({}, "_id username email").limit(perUser).lean();

    // لو ما في ولا مستخدم، أرجع صفر
    if (!seedUsers.length) {
      return res.status(201).json({ message: "لا يوجد مستخدمون لإرسال إشعارات تجريبية.", created: 0, ids: [] });
    }

    // حضّر عينات لكل مستخدم (وثائق حقيقية حسب السكيمة الحالية)
    const docs = [];
    const now = Date.now();
    const types = ["SYSTEM", "MESSAGE", "AD", "TRANSACTION"];

    for (const u of seedUsers) {
      for (let i = 0; i < count; i++) {
        const t = types[i % types.length];
        docs.push({
          user: u._id,
          type: t,
          title: `${t} إشعار تجريبي #${i + 1} للمستخدم ${u.username || u.email || u._id.toString().slice(-4)}`,
          body: `هذا إشعار ${t} تجريبي رقم ${i + 1} — مفيد لاختبار الواجهة.`,
          data: {
            demo: true,
            hint: "تستطيع عرض هذا الpayload داخل البطاقة عند الحاجة",
          },
          isRead: i === 0 ? true : false, // خليه يختلط مقروء/غير مقروء لأغراض الفرونت
          createdAt: new Date(now - 1000 * 60 * (i + 1)),
          updatedAt: new Date(now - 1000 * 60 * (i + 1)),
        });
      }
    }

    const inserted = await Notification.insertMany(docs, { ordered: false });
    return res.status(201).json({
      message: "تم إنشاء إشعارات تجريبية.",
      created: inserted.length,
      ids: inserted.map((d) => d._id),
    });
  } catch (err) {
    console.error("seedDemoNotifications error:", err);
    return res.status(500).json({ message: "خطأ أثناء توليد الإشعارات", error: err.message });
  }
};

// (اختياري) حذف إشعار للمستخدم (soft delete)
exports.deleteMyNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "غير موجود" });
    res.json({ message: "تم حذف الإشعار.", notification: updated });
  } catch (e) {
    res.status(500).json({ message: "خطأ أثناء الحذف", error: e.message });
  }
};

// إنشاء بودكاست/إعلان صوتي يظهر عند الكل
// POST /notifications/podcast/broadcast   (Admin فقط)
exports.broadcastPodcast = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title ) {
      return res.status(400).json({ message: "title مطلوب" });
    }

    // جيب كل المستخدمين
    const users = await User.find({}, "_id").lean();
    if (!users.length) {
      return res.status(400).json({ message: "لا يوجد مستخدمون لإرسال البودكاست." });
    }

    const docs = users.map((u) => ({
      user: u._id,
      type: "PODCAST",
      title,
      body,
      data: {
        podcast: true,
        createdBy: req.user.id,
      },
    }));

    const inserted = await Notification.insertMany(docs);

    // WebSocket broadcast: عشان الداشبورد عند الكل يسمع الحدث فوراً
    emitBroadcastPodcast({
      title,
      body,
      createdBy: req.user.id,
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "تم إنشاء البودكاست وإرساله للجميع.",
      count: inserted.length,
    });
  } catch (e) {
    console.error("broadcastPodcast error:", e);
    return res.status(500).json({ message: "خطأ أثناء إرسال البودكاست", error: e.message });
  }
};
