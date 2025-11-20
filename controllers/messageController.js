const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createNotification } = require("../controllers/notificationController");
const {
  emitNewMessage,
  emitMessagesRead,
} = require("../sockets/messagesSocket");

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

    // لو أرسلت من صفحة إعلان، adId بيوصل من الفرونت
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
      ad: convo.ad || adId || undefined, // 🔗 ربط الرسالة بالإعلان
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
      data: { conversationId: convo._id, from: fromId, adId: convo.ad || adId },
    });

    // نعمل populate مشان السوكيت يبعث داتا جاهزة للواجهة
    const populatedMsg = await msg
      .populate("from", "username email phoneNumber")
      .populate("to", "username email phoneNumber")
      .populate("ad", "title priceSYP priceUSD");

    const populatedConvo = await convo
      .populate("participants", "username email phoneNumber isSellerVerified")
      .populate("ad", "title priceSYP priceUSD");

    // 🔔 بث الرسالة عبر WebSocket
    emitNewMessage({
      message: populatedMsg,
      conversation: populatedConvo,
    });

    return res.status(201).json({
      message: populatedMsg,
      conversation: populatedConvo,
    });
  } catch (e) {
    console.error("sendMessage error:", e);
    return res
      .status(500)
      .json({ message: "خطأ أثناء إرسال الرسالة", error: e.message });
  }
};


const listMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const convos = await Conversation.find({ participants: userId })
      .sort({ lastAt: -1 })
      .populate(
        "participants",
        "username email phoneNumber isSellerVerified avatarUrl"
      )
      .populate("ad", "title priceSYP priceUSD slug");

    return res.json({ items: convos });
  } catch (e) {
    console.error("listMyConversations error:", e);
    return res
      .status(500)
      .json({ message: "خطأ أثناء جلب المحادثات", error: e.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const convo = await Conversation.findById(id).populate(
      "ad",
      "title priceSYP priceUSD slug"
    );
    if (
      !convo ||
      !convo.participants.map(String).includes(String(userId))
    ) {
      return res.status(404).json({
        message: "محادثة غير موجودة أو لا تملك صلاحية الوصول.",
      });
    }

    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .populate("from", "username email")
      .populate("to", "username email")
      .populate("ad", "title priceSYP priceUSD");

    // علّم رسائل المستلم كـ مقروءة
    const result = await Message.updateMany(
      { conversation: id, to: userId, isRead: false },
      { isRead: true }
    );

    // 🔔 بث read receipts للطرف الآخر
    const otherId = convo.participants
      .map(String)
      .find((pid) => pid !== String(userId));
    if (otherId) {
      emitMessagesRead({
        conversationId: id,
        readerId: userId,
        otherUserId: otherId,
      });
    }

    return res.json({
      items: messages,
      conversation: convo,
      markedReadCount: result.modifiedCount || 0,
    });
  } catch (e) {
    console.error("getConversationMessages error:", e);
    return res
      .status(500)
      .json({ message: "خطأ أثناء جلب الرسائل", error: e.message });
  }
};

const getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      to: userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .populate("from", "username email")
      .populate("ad", "title priceSYP priceUSD");

    return res.json({ items: messages });
  } catch (e) {
    console.error("getUnreadMessages error:", e);
    return res.status(500).json({
      message: "خطأ أثناء جلب الرسائل غير المقروءة",
      error: e.message,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      to: userId,
      isRead: false,
    });

    return res.json({ count });
  } catch (e) {
    console.error("getUnreadCount error:", e);
    return res.status(500).json({
      message: "خطأ أثناء جلب عدد الرسائل غير المقروءة",
      error: e.message,
    });
  }
};
module.exports = {
  sendMessage,
  listMyConversations,
  getConversationMessages,
  getUnreadMessages,
  getUnreadCount
};
