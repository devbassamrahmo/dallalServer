const mongoose = require("mongoose");

const VALID_TYPES = ["property", "car", "job", "service", "device", "teacher"];

const RequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: VALID_TYPES,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // الأسعار بالليرة
    priceTryMin: { type: Number, required: true, min: 0 },
    priceTryMax: { type: Number, required: true, min: 0 },

    // الأسعار بالدولار
    priceUsdMin: { type: Number, required: true, min: 0 },
    priceUsdMax: { type: Number, required: true, min: 0 },

    // حالة الطلب (اختياري)
    status: {
      type: String,
      enum: ["open", "in_progress", "fulfilled", "closed"],
      default: "open",
      index: true,
    },

    // مكان (اختياري، إذا بتحب تضيفه)
    location: { type: String, trim: true, index: true },

    // قنوات تواصل (اختياري)
    contactPhone: { type: String, trim: true },
    contactWhatsApp: { type: String, trim: true },
  },
  { timestamps: true }
);

// تأكد أن min ≤ max في العملتين
RequestSchema.pre("validate", function (next) {
  if (this.priceTryMin > this.priceTryMax) {
    return next(new Error("priceTryMin يجب أن يكون أقل من أو يساوي priceTryMax"));
  }
  if (this.priceUsdMin > this.priceUsdMax) {
    return next(new Error("priceUsdMin يجب أن يكون أقل من أو يساوي priceUsdMax"));
  }
  next();
});

RequestSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Request", RequestSchema);
module.exports.VALID_TYPES = VALID_TYPES;
