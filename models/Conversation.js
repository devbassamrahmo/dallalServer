const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }], // عادة 2
  lastMessageAt: { type: Date, index: true },
  lastMessage:   { type: String }, // سنابشوت لعرض القائمة
  unreadCounts: [{
    user:  { type: Schema.Types.ObjectId, ref: "User" },
    count: { type: Number, default: 0 }
  }],
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
