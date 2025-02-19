const Ad = require("../models/Ad");
const CarAd = require("../models/CarAd");
const RealEstateAd = require("../models/RealEstateAd");
const BikeAd = require("../models/BikeAd");

// ✅ Create an Ad Based on Category
const createAd = async (req, res) => {
  try {
    const { title, location, images, condition, category, priceSYP, priceUSD, description, additionalFields } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    let newAd;

    switch (category) {
      case "car":
        newAd = new CarAd({ title, location, images, condition, category, priceSYP, priceUSD, description, user: req.user.id, ...additionalFields });
        break;
      case "bike":
        newAd = new BikeAd({ title, location, images, condition, category, priceSYP, priceUSD, description, user: req.user.id, ...additionalFields });
        break;
      case "real_estate":
        newAd = new RealEstateAd({ title, location, images, condition, category, priceSYP, priceUSD, description, user: req.user.id, ...additionalFields });
        break;
      case "electronics":
        newAd = new ElectronicsAd({ title, location, images, condition, category, priceSYP, priceUSD, description, user: req.user.id, ...additionalFields });
        break;
      default:
        newAd = new GeneralAd({ title, location, images, condition, category, priceSYP, priceUSD, description, user: req.user.id, ...additionalFields });
    }

    await newAd.save();
    res.status(201).json({ message: "Ad created successfully", ad: newAd });
  } catch (error) {
    res.status(500).json({ message: "Error creating ad", error: error.message });
  }
};

// ✅ Get All Ads
const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().populate("user", "username email");
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ads", error: error.message });
  }
};

// ✅ Get Ad by ID
const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("user", "username email");
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ad", error: error.message });
  }
};

// ✅ Delete Ad (Only Owner Can Delete)
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // Ensure only the owner can delete
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this ad" });
    }

    await ad.deleteOne();
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ad", error: error.message });
  }
};

module.exports = { createAd, getAllAds, getAdById, deleteAd };
