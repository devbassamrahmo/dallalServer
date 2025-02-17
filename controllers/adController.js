const Ad = require("../models/Ad");

const createAd = async (req, res) => {
  try {
    const { title, description, price, category, location, images, user } = req.body;

    const newAd = new Ad({ title, description, price, category, location, images, user });
    await newAd.save();

    res.status(201).json({ message: "Ad created successfully", ad: newAd });
  } catch (error) {
    res.status(500).json({ message: "Error creating ad", error: error.message });
  }
};

const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().populate("user", "username email");
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ads", error: error.message });
  }
};

const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("user", "username email");
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ad", error: error.message });
  }
};

const updateAd = async (req, res) => {
  try {
    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAd) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.status(200).json({ message: "Ad updated successfully", ad: updatedAd });
  } catch (error) {
    res.status(500).json({ message: "Error updating ad", error: error.message });
  }
};

const deleteAd = async (req, res) => {
  try {
    const deletedAd = await Ad.findByIdAndDelete(req.params.id);
    if (!deletedAd) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.status(200).json({ message: "Ad deleted successfully", ad: deletedAd });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ad", error: error.message });
  }
};

module.exports = { createAd, getAllAds, getAdById, updateAd, deleteAd };
