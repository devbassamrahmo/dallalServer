const Ad = require("../models/Ad");

// ✅ Create Ad (Only Authenticated Users)
const createAd = async (req, res) => {
  try {
    const { title, description, price, category, location, images } = req.body;
    const newAd = new Ad({ 
      title, 
      description, 
      price, 
      category, 
      location, 
      images, 
      user: req.user.id  // ✅ Store ad owner ID from JWT
    });

    await newAd.save();
    res.status(201).json({ message: "Ad created successfully", ad: newAd });
  } catch (error) {
    res.status(500).json({ message: "Error creating ad", error: error.message });
  }
};

// ✅ Get All Ads (Public)
const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().populate("user", "username email");
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ads", error: error.message });
  }
};

// ✅ Get Ad by ID (Public)
const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("user", "username email");
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ad", error: error.message });
  }
};

// ✅ Update Ad (Only Owner Can Edit)
const updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // ✅ Check if the user is the owner
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this ad" });
    }

    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Ad updated successfully", ad: updatedAd });
  } catch (error) {
    res.status(500).json({ message: "Error updating ad", error: error.message });
  }
};

// ✅ Delete Ad (Only Owner Can Delete)
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // ✅ Check if the user is the owner
    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this ad" });
    }

    await ad.deleteOne();
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ad", error: error.message });
  }
};

module.exports = { createAd, getAllAds, getAdById, updateAd, deleteAd };
