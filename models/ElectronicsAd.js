const mongoose = require("mongoose");
const Ad = require("./Ad");

const electronicsSchema = new mongoose.Schema({
  deviceType: { type: String, required: true }
});

// ✅ Create ElectronicsAd Discriminator
const ElectronicsAd = Ad.discriminator("Electronics", electronicsSchema);

module.exports = ElectronicsAd;
