const mongoose = require("mongoose");
const Counter = require('./Counter');
const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    images: [{ type: String, required: true }], // تخزين روابط الصور
    category: {
      type: String,
      required: true,
      enum: ["car", "bike", "real_estate", "electronics", "furniture", "education", "services", "pets", "jobs", "parties" ,"others"],
    },
    priceSYP: { type: Number, required: true },
    priceUSD: { type: Number, required: true },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    expiresAt: { type: Date }, 
    adNumber: { type: Number, unique: true },
  },
  { timestamps: true, discriminatorKey: "categoryType" }
);

adSchema.pre('save', async function (next) {
  const ad = this;
  
  if (ad.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'ad' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true } 
    );
    ad.adNumber = counter.seq;
  }
  
  next();
});

const Ad = mongoose.model("Ad", adSchema);
module.exports = Ad;
