const Comment = require('../models/Comment');
const Ad = require('../models/Ad');

const addCommentOrReply = async (req, res) => {
  try {
    const { adId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id; 

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'الإعلان غير موجود' });
    }

    const comment = new Comment({
      adId,
      userId,
      content,
      parentCommentId: parentCommentId || null
    });

    await comment.save();

    res.status(201).json({ message: 'تم إضافة التعليق بنجاح', comment });
  } catch (error) {
    console.error('خطأ أثناء إضافة تعليق:', error);
    res.status(500).json({ message: 'خطأ أثناء إضافة التعليق', error: error.message });
  }
};

const getCommentsForAd = async (req, res) => {
  try {
    const { adId } = req.params;

    const comments = await Comment.find({ adId, parentCommentId: null })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    for (let comment of comments) {
      const replies = await Comment.find({ parentCommentId: comment._id })
        .populate('userId', 'username')
        .sort({ createdAt: 1 })
        .lean();
      comment.replies = replies;
    }

    res.status(200).json(comments);
  } catch (error) {
    console.error('خطأ أثناء جلب التعليقات:', error);
    res.status(500).json({ message: 'خطأ أثناء جلب التعليقات', error: error.message });
  }
};

const deleteCommentOrReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id; 

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'التعليق غير موجود' });
    }

    if (comment.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا التعليق' });
    }

    if (!comment.parentCommentId) {
      await Comment.deleteMany({ parentCommentId: comment._id });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: 'تم حذف التعليق بنجاح' });
  } catch (error) {
    console.error('خطأ أثناء حذف تعليق:', error);
    res.status(500).json({ message: 'خطأ أثناء حذف التعليق', error: error.message });
  }
};

module.exports = {
  addCommentOrReply,
  getCommentsForAd,
  deleteCommentOrReply
};
