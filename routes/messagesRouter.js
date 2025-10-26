const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const m = require("../controllers/messageController");

router.post("/conversation", protect, m.getOrCreateConversation);
router.get("/conversations", protect, m.myConversations);
router.get("/conversation/:id", protect, m.getMessages);
router.post("/send", protect, m.sendMessage);
router.post("/conversation/:id/read", protect, m.markConversationRead);

module.exports = router;
