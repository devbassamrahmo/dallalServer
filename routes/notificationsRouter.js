const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const n = require("../controllers/notificationController");

router.get("/", protect, n.listMyNotifications);
router.get("/unread-count", protect, n.unreadCount);
router.patch("/:id/read", protect, n.markRead);
router.post("/read-all", protect, n.markAllRead);

module.exports = router;
