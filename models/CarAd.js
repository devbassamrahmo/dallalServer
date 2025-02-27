const mongoose = require("mongoose");
const Ad = require("./Ad");

const carBikeSchema = new mongoose.Schema({
  transmission: { type: String, enum: ["manual", "automatic"], required: true },
  vehicleType: { type: String, required: true },
  mileage: { type: Number, required: true }
});

// ✅ Create CarAd & BikeAd as Discriminators
const CarAd = Ad.discriminator("Car", carBikeSchema);
const BikeAd = Ad.discriminator("Bike", carBikeSchema);

module.exports = { CarAd, BikeAd };
