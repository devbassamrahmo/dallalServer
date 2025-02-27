const mongoose = require("mongoose");
const Ad = require("./Ad");

const realEstateSchema = new mongoose.Schema({
  condition: { type: String, enum: ["furnished", "unfurnished", "shell"], required: true },
  propertyType: { type: String, required: true },
  deedType: { type: String, required: true },
  newHousingProject: { type: Boolean, required: true },
});

const RealEstateAd = Ad.discriminator("RealEstate", realEstateSchema);

module.exports = RealEstateAd;
