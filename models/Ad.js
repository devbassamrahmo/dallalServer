const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    images: [{ type: String, required: true }], // تخزين روابط الصور
    category: {
      type: String,
      required: true,
      enum: ["car", "bike", "real_estate", "electronics", "furniture", "education", "services", "pets", "jobs", "others"],
    },
    priceSYP: { type: Number, required: true },
    priceUSD: { type: Number, required: true },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    expiresAt: { type: Date }, // تاريخ انتهاء الإعلان
  },
  { timestamps: true, discriminatorKey: "categoryType" }
);

const Ad = mongoose.model("Ad", adSchema);
module.exports = Ad;
