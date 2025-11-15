const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const m = require("../controllers/messageController");

router.post("/", protect, m.sendMessage); // POST /api/messages
router.get("/conversations", protect, m.listMyConversations);
router.get("/conversations/:id", protect, m.getConversationMessages);

module.exports = router;
