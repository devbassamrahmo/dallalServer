// sockets/notificationSocket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;
const userSockets = new Map(); // userId -> Set(socketId)

function initNotificationSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // نتوقع التوكن يجي من auth أو query
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return socket.disconnect(true);
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return socket.disconnect(true);
    }

    const userId = String(payload.id);
    socket.data.userId = userId;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    socket.on("disconnect", () => {
      const set = userSockets.get(userId);
      if (!set) return;
      set.delete(socket.id);
      if (!set.size) {
        userSockets.delete(userId);
      }
    });
  });

  console.log("✅ WebSocket for notifications initialized");
  return io;
}

// إرسال نوتيفيكيشن جديد لمستخدم معيّن
function emitNotificationToUser(userId, notification) {
  if (!io) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;

  sockets.forEach((sid) => {
    io.to(sid).emit("notification:new", notification);
  });
}

// بودكاست/إعلان عام يروح للجميع
function emitBroadcastPodcast(podcastPayload) {
  if (!io) return;
  io.emit("podcast:new", podcastPayload);
}

module.exports = {
  initNotificationSocket,
  emitNotificationToUser,
  emitBroadcastPodcast,
};
