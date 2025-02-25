const mongoose = require("mongoose");
const Ad = require("../models/Ad");
require("dotenv").config();

const deleteExpiredAds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const expiredAds = await Ad.find({ expiresAt: { $lt: new Date() } });

    for (const ad of expiredAds) {
      await ad.deleteOne();
      console.log(`Deleted expired ad: ${ad._id}`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error deleting expired ads:", error);
  }
};

// Run the function
deleteExpiredAds();
