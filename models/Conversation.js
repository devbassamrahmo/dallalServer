const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ], // غالباً 2
    lastMessage: { type: String },
    lastSender:  { type: Schema.Types.ObjectId, ref: "User" },
    lastAt:      { type: Date },
    ad:          { type: Schema.Types.ObjectId, ref: "Ad" }, // محادثة حول إعلان معيّن (اختياري)
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
