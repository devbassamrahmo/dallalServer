const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  sender:       { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  to:           [{ type: Schema.Types.ObjectId, ref: "User", index: true }], // المستلمين (غالبًا واحد)
  body:         { type: String }, // نص الرسالة
  attachments:  [{ url: String, mime: String, size: Number, name: String }], // إن وجدت
  // حالة القراءة لكل مستلم
  readBy:       [{
    user: { type: Schema.Types.ObjectId, ref: "User" },
    at:   { type: Date }
  }],
  // حالة الحذف لكل مستخدم (إخفاء محلي)
  deletedFor:   [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
