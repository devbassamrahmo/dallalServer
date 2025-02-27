const mongoose = require("mongoose");
const Ad = require("./Ad");

const realEstateSchema = new mongoose.Schema({
  propertyType: { type: String, required: true },
  deedType: { type: String, required: true },
  newHousingProject: { type: Boolean, required: true }
});

// ✅ Create RealEstateAd Discriminator
const RealEstateAd = Ad.discriminator("RealEstate", realEstateSchema);

module.exports = RealEstateAd;
