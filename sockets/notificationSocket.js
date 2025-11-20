// sockets/notificationSocket.js
const jwt = require("jsonwebtoken");

let ioInstance;
const userSockets = new Map(); // userId -> Set(socketId)

function initNotificationSocket(io) {
  ioInstance = io;

  ioInstance.on("connection", (socket) => {
    // نتوقع التوكن يجي من auth أو query
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      console.log("notifications: no token, disconnect");
      return socket.disconnect(true);
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      console.log("notifications: invalid token, disconnect");
      return socket.disconnect(true);
    }

    const userId = String(payload.id);
    socket.data.userId = userId;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    console.log("notifications: user connected", userId, "socket:", socket.id);

    socket.on("disconnect", () => {
      const set = userSockets.get(userId);
      if (!set) return;
      set.delete(socket.id);
      if (!set.size) {
        userSockets.delete(userId);
      }
      console.log("notifications: user disconnected", userId);
    });
  });

  console.log("✅ WebSocket for notifications initialized");
  return ioInstance;
}

// إرسال نوتيفيكيشن جديد لمستخدم معيّن
function emitNotificationToUser(userId, notification) {
  if (!ioInstance) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;

  sockets.forEach((sid) => {
    ioInstance.to(sid).emit("notification:new", notification);
  });
}

// بودكاست/إعلان عام يروح للجميع
function emitBroadcastPodcast(podcastPayload) {
  if (!ioInstance) return;
  ioInstance.emit("podcast:new", podcastPayload);
}

module.exports = {
  initNotificationSocket,
  emitNotificationToUser,
  emitBroadcastPodcast,
};
