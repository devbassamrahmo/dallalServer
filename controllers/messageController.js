const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createNotification } = require("../controllers/notificationController");

// إرسال رسالة
const sendMessage = async (req, res) => {
  try {
    const fromId = req.user.id;
    const { to, body, adId } = req.body;

    if (!to || !body) {
      return res.status(400).json({ message: "to و body مطلوبان." });
    }

    if (String(to) === String(fromId)) {
      return res.status(400).json({ message: "لا يمكنك إرسال رسالة لنفسك." });
    }

    let convo = await Conversation.findOne({
      participants: { $all: [fromId, to] },
      ...(adId ? { ad: adId } : {}),
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [fromId, to],
        ad: adId || undefined,
      });
    }

    const msg = await Message.create({
      conversation: convo._id,
      from: fromId,
      to,
      body,
    });

    convo.lastMessage = body;
    convo.lastSender = fromId;
    convo.lastAt = new Date();
    await convo.save();

    // نوتيفيكشن للمستلم
    await createNotification({
      userId: to,
      type: "MESSAGE",
      title: "رسالة جديدة",
      body: body.slice(0, 80),
      data: { conversationId: convo._id, from: fromId },
    });

    return res.status(201).json({ message: msg, conversation: convo });
  } catch (e) {
    console.error("sendMessage error:", e);
    return res.status(500).json({ message: "خطأ أثناء إرسال الرسالة", error: e.message });
  }
};

const listMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const convos = await Conversation.find({ participants: userId })
      .sort({ lastAt: -1 })
      .populate("participants", "username email phoneNumber isSellerVerified")
      .populate("ad", "title priceSYP priceUSD");

    return res.json({ items: convos });
  } catch (e) {
    console.error("listMyConversations error:", e);
    return res.status(500).json({ message: "خطأ أثناء جلب المحادثات", error: e.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const convo = await Conversation.findById(id);
    if (!convo || !convo.participants.map(String).includes(String(userId))) {
      return res.status(404).json({ message: "محادثة غير موجودة أو لا تملك صلاحية الوصول." });
    }

    const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 });

    await Message.updateMany(
      { conversation: id, to: userId, isRead: false },
      { isRead: true }
    );

    return res.json({ items: messages });
  } catch (e) {
    console.error("getConversationMessages error:", e);
    return res.status(500).json({ message: "خطأ أثناء جلب الرسائل", error: e.message });
  }
};

module.exports = {
  sendMessage,
  listMyConversations,
  getConversationMessages,
};
