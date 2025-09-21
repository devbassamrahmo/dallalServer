// const mongoose = require('mongoose');

// const SponsorSchema = new mongoose.Schema({
//     imageUrl: { type: String, required: true }, // Cloudinary URL
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Sponsor', SponsorSchema);


// models/Sponsor.js
const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },   // رابط عام (أو موقّت لو Private)
  objectPath: { type: String, required: true }, // المسار داخل الباكت (مثل sponsors/123.png)
  bucket: { type: String, default: process.env.SUPABASE_BUCKET },
  contentType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sponsor', SponsorSchema);
