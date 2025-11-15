const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user:      { type: Schema.Types.ObjectId, ref: "User", index: true, required: true }, // المستلم
    type:      { type: String, enum: ["SYSTEM", "MESSAGE", "AD", "TRANSACTION" , "PODCAST"], default: "SYSTEM", index: true },
    title:     { type: String, required: true },
    body:      { type: String },
    data:      { type: Schema.Types.Mixed }, // أي payload إضافي (IDs, URLs...)
    isRead:    { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true }, // للـ soft-delete إن رغبت
  },
  { timestamps: true }
);

// فهارس مساعدة للاستعلام السريع
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
