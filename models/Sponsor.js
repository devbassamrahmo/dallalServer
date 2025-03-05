const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true }, // Cloudinary URL
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sponsor', SponsorSchema);
