const mongoose = require("mongoose");
const Ad = require("./Ad");

const bikeAdSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true }, // ✅ Type of bike
  transmission: { type: String, enum: ["manual", "automatic"], required: true },
  mileage: { type: Number, required: true },
  condition: { type: String, enum: ["new", "used"], required: true }
});

const BikeAd = Ad.discriminator("Bike", bikeAdSchema);
module.exports = BikeAd;
