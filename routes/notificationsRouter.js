const router = require("express").Router();
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const n = require("../controllers/notificationController");

// صندوق إشعارات المستخدم
router.get("/", protect, n.listMyNotifications);
router.get("/unread-count", protect, n.unreadCount);
router.patch("/:id/read", protect, n.markRead);
router.post("/read-all", protect, n.markAllRead);
router.delete("/:id", protect, n.deleteMyNotification); // اختياري: حذف (soft)

// Seed للإدمن — يولّد إشعارات حقيقية لكل مستخدم (حسب perUser & count)
router.post("/seed", protect, isAdmin, n.seedDemoNotifications);

// 🎧 بودكاست عام يظهر عند الكل (داشبورد أدمن)
router.post("/podcast/broadcast", protect, isAdmin, n.broadcastPodcast);
module.exports = router;
