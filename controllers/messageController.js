const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

function ensureUnreadBucket(conv, userId) {
  const idx = conv.unreadCounts.findIndex(u => String(u.user) === String(userId));
  if (idx === -1) conv.unreadCounts.push({ user: userId, count: 0 });
  return conv.unreadCounts.find(u => String(u.user) === String(userId));
}

exports.getOrCreateConversation = async (req, res) => {
  try {
    const me = req.user.id;
    const { withUserId } = req.body;
    if (!withUserId) return res.status(400).json({ message: "withUserId مطلوب." });

    let conv = await Conversation.findOne({ participants: { $all: [me, withUserId], $size: 2 } });
    if (!conv) {
      conv = await Conversation.create({
        participants: [me, withUserId],
        lastMessageAt: new Date(0),
        unreadCounts: [{ user: me, count: 0 }, { user: withUserId, count: 0 }]
      });
    }
    res.json(conv);
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const me = req.user.id;
    const { conversationId, toUserId, body, attachments = [] } = req.body;

    let conv = conversationId
      ? await Conversation.findById(conversationId)
      : await Conversation.findOne({ participants: { $all: [me, toUserId], $size: 2 } });

    if (!conv && !toUserId) return res.status(400).json({ message: "conversationId أو toUserId مطلوب." });
    if (!conv) {
      conv = await Conversation.create({
        participants: [me, toUserId],
        lastMessageAt: new Date()
      });
    }

    // تحقق أني مشارك بالمحادثة
    if (!conv.participants.map(String).includes(String(me))) {
      return res.status(403).json({ message: "ليست محادثتك." });
    }

    const others = conv.participants.filter(u => String(u) !== String(me));
    const msg = await Message.create({
      conversation: conv._id,
      sender: me,
      to: others,
      body,
      attachments
    });

    // حدث آخر رسالة وعدّادات غير مقروء
    conv.lastMessageAt = msg.createdAt;
    conv.lastMessage   = body ? body.slice(0, 200) : (attachments.length ? "[Attachment]" : "");
    // زدّ عداد غير مقروء للمستلمين
    others.forEach((uid) => {
      const bucket = ensureUnreadBucket(conv, uid);
      bucket.count = (bucket.count || 0) + 1;
    });
    await conv.save();

    // أنشئ إشعار لكل مستلم
    await Promise.all(others.map(uid => Notification.create({
      user: uid,
      type: "MESSAGE",
      title: "رسالة جديدة",
      body: body ? body.slice(0, 120) : "لديك رسالة جديدة",
      data: { conversationId: conv._id, messageId: msg._id, from: me }
    })));

    // بث سوكِت (إن مستخدم Socket.IO)
    req.io?.to(String(others[0])).emit("message:new", { conversationId: conv._id, message: msg });

    res.status(201).json({ conversation: conv, message: msg });
  } catch (e) {
    res.status(500).json({ message: "خطأ بالإرسال", error: e.message });
  }
};

exports.myConversations = async (req, res) => {
  try {
    const me = req.user.id;
    const list = await Conversation.find({ participants: me })
      .sort({ lastMessageAt: -1 })
      .limit(50);
    // ضيف unreadCount لي
    const items = list.map(c => {
      const mine = c.unreadCounts?.find(u => String(u.user) === String(me));
      return { ...c.toObject(), myUnread: mine ? mine.count : 0 };
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const me = req.user.id;
    const { id } = req.params; // conversationId
    const { before, limit = 30 } = req.query;

    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.map(String).includes(String(me))) {
      return res.status(404).json({ message: "المحادثة غير موجودة." });
    }

    const q = { conversation: id };
    if (before) q.createdAt = { $lt: new Date(before) };

    const msgs = await Message.find(q).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ items: msgs.reverse() });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const me = req.user.id;
    const { id } = req.params; // conversationId
    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.map(String).includes(String(me))) {
      return res.status(404).json({ message: "غير موجود." });
    }
    // صفر عدّادي
    const mine = conv.unreadCounts?.find(u => String(u.user) === String(me));
    if (mine) mine.count = 0;
    await conv.save();

    // عيّن الرسائل كمقروءة لهذا المستخدم
    await Message.updateMany(
      { conversation: id, to: me, "readBy.user": { $ne: me } },
      { $push: { readBy: { user: me, at: new Date() } } }
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "خطأ", error: e.message });
  }
};
