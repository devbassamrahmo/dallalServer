const mongoose = require("mongoose");
const Ad = require("./Ad");

const carAdSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true }, // ✅ Type of vehicle
  transmission: { type: String, enum: ["manual", "automatic"], required: true }, // ✅ Transmission type
  mileage: { type: Number, required: true },
  condition: { type: String, enum: ["new", "used"], required: true } // ✅ Distance driven in km
});

const CarAd = Ad.discriminator("Car", carAdSchema);
module.exports = CarAd;
