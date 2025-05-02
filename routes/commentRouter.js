const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/:adId', protect, commentController.addCommentOrReply);
router.get('/:adId', commentController.getCommentsForAd);
router.delete('/:commentId', protect, commentController.deleteCommentOrReply);

module.exports = router;
