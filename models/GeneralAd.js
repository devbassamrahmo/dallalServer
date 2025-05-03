const mongoose = require("mongoose");
const Ad = require("./Ad");

const generalAdSchema = new mongoose.Schema({
  condition: { type: String, enum: ["new", "used"], required: true },
  adType: { type: String },
  
});

const GeneralAd = Ad.discriminator("General", generalAdSchema);

module.exports = GeneralAd;
