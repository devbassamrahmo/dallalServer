const Notification = require("../models/Notification");

exports.createNotification = async ({ userId, type, title, body, data }) => {
  const notif = await Notification.create({ user: userId, type, title, body, data });
  return notif;
};

exports.listMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const q = { user: userId, isDeleted: false };
    const [items, total] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      Notification.countDocuments(q)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ message: "خطأ بجلب الإشعارات", error: e.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const doc = await Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });
    if (!doc) return res.status(404).json({ message: "غير موجود" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ user: userId, isRead: false, isDeleted: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};
