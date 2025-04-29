const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect , isAdmin} = require("../middlewares/authMiddleware");

router.post('/:adId', protect, commentController.addComment);
router.get('/:adId', commentController.getCommentsForAd);

module.exports = router;
