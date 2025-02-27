const mongoose = require("mongoose");
const Ad = require("./Ad");

const electronicsSchema = new mongoose.Schema({
  condition: { type: String, enum: ["new", "used"], required: true },
  deviceType: { type: String, required: true },
});

const ElectronicsAd = Ad.discriminator("Electronics", electronicsSchema);

module.exports = ElectronicsAd;
