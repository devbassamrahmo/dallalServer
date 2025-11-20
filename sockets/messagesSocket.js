// sockets/messagesSocket.js
let ioInstance = null;

// userId (string) => Set<socketId>
const userSockets = new Map();

/**
 * تهيئة سوكيت الرسائل
 * ينادى من server.js بعد إنشاء io
 */
function initMessagesSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("messages socket connected:", socket.id);

    // الكلاينت لازم يبعت event اسمه "auth" أو "messages:auth" مع userId بعد الاتصال
    socket.on("messages:auth", (userId) => {
      if (!userId) return;
      const uid = String(userId);
      socket.userId = uid;

      if (!userSockets.has(uid)) {
        userSockets.set(uid, new Set());
      }
      userSockets.get(uid).add(socket.id);

      console.log("user connected to messages:", uid, "socket:", socket.id);
    });

    // typing indicator
    socket.on("messages:typing", ({ to, conversationId }) => {
      if (!socket.userId || !to) return;
      emitToUser(String(to), "messages:typing", {
        from: socket.userId,
        conversationId,
      });
    });

    socket.on("disconnect", () => {
      const uid = socket.userId;
      if (uid && userSockets.has(uid)) {
        const set = userSockets.get(uid);
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(uid);
        }
      }
      console.log("messages socket disconnected:", socket.id);
    });
  });
}

/**
 * إرسال event لكل سوكيتات user معيّن
 */
function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;
  sockets.forEach((sid) => {
    ioInstance.to(sid).emit(event, payload);
  });
}

/**
 * لما تنبعت رسالة جديدة من الـ HTTP controller
 */
function emitNewMessage({ message, conversation }) {
  if (!ioInstance || !message) return;

  const toId = String(message.to);
  const fromId = String(message.from);

  // للمستلم
  emitToUser(toId, "messages:new", {
    message,
    conversation,
  });

  // للمرسل (لتأكيد الإرسال وتحديث آخر رسالة)
  emitToUser(fromId, "messages:sent", {
    message,
    conversation,
  });
}

/**
 * لما ينقرأوا رسائل محادثة معيّنة
 */
function emitMessagesRead({ conversationId, readerId, otherUserId }) {
  if (!ioInstance) return;
  if (!otherUserId) return;

  emitToUser(String(otherUserId), "messages:read", {
    conversationId,
    readerId,
  });
}

module.exports = {
  initMessagesSocket,
  emitNewMessage,
  emitMessagesRead,
};
