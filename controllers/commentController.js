// controllers/commentController.js
const Comment = require('../models/Comment');
const Ad = require('../models/Ad');

const addComment = async (req, res) => {
  try {
    const { adId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; 

    
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'الإعلان غير موجود' });
    }

    const comment = new Comment({ adId, userId, content });
    await comment.save();

    res.status(201).json({ message: 'تم إضافة التعليق بنجاح', comment });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء إضافة التعليق', error: error.message });
  }
};

const getCommentsForAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const comments = await Comment.find({ adId }).populate('userId', 'username');

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب التعليقات', error: error.message });
  }
};

module.exports = { addComment, getCommentsForAd };
