// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  adId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ad', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    trim: true 
  },
  parentCommentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Comment', commentSchema);
