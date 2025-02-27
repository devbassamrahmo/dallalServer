const mongoose = require("mongoose");
const Ad = require("./Ad");

const carBikeSchema = new mongoose.Schema({
  condition: { type: String, enum: ["new", "used"], required: true },
  vehicleType: { type: String, required: true },
  transmission: { type: String, enum: ["manual", "automatic"], required: true },
  mileage: { type: Number, required: true },
});

const CarAd = Ad.discriminator("Car", carBikeSchema);
const BikeAd = Ad.discriminator("Bike", carBikeSchema);

module.exports = { CarAd, BikeAd };
