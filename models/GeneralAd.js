const mongoose = require("mongoose");
const Ad = require("./Ad");

const generalAdSchema = new mongoose.Schema({
  adType: { type: String, required: true }
});

// ✅ Create GeneralAd Discriminator
const GeneralAd = Ad.discriminator("General", generalAdSchema);

module.exports = GeneralAd;
