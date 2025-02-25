const Ad = require("../models/Ad");
const CarAd = require("../models/CarAd");
const RealEstateAd = require("../models/RealEstateAd");
const BikeAd = require("../models/BikeAd");
const cloudinary = require("../config/cloudinary");
// ✅ Create an Ad Based on Category
const createAd = async (req, res) => {
  try {
    const { title, location, category, priceSYP, priceUSD, description, additionalFields } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const imageUrls = req.files.map((file) => file.path); // ✅ Get Cloudinary URLs

    const newAd = new Ad({
      title,
      location,
      category,
      priceSYP,
      priceUSD,
      description,
      images: imageUrls,
      user: req.user.id,
      ...additionalFields,
    });

    await newAd.save();
    res.status(201).json({ message: "Ad created successfully", ad: newAd });
  } catch (error) {
    res.status(500).json({ message: "Error creating ad", error: error.message });
  }
};

// ✅ Get All Ads
const getAllAds = async (req, res) => {
  try {
    const { search, category, location, minPrice, maxPrice, condition, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } }, 
        { description: { $regex: search, $options: "i" } }
      ];
    }

    //by Category
    if (category) filter.category = category;

    //by Location
    if (location) filter.location = { $regex: location, $options: "i" };

    //by Price Range
    if (minPrice || maxPrice) {
      filter.$or = [
        { priceSYP: {} },
        { priceUSD: {} }
      ];
      if (minPrice) {
        filter.$or[0].priceSYP.$gte = minPrice;
        filter.$or[1].priceUSD.$gte = minPrice;
      }
      if (maxPrice) {
        filter.$or[0].priceSYP.$lte = maxPrice;
        filter.$or[1].priceUSD.$lte = maxPrice;
      }
    }

    //Condition (new/used/furnished/etc.)
    if (condition) filter.condition = condition;

    // Pagination
    const skip = (page - 1) * limit;

    // Get Ads with Filters
    const ads = await Ad.find(filter).skip(skip).limit(parseInt(limit));

    res.status(200).json({ total: ads.length, ads });
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

    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this ad" });
    }

    // 🔥 Delete images from Cloudinary
    for (const imgUrl of ad.images) {
      const publicId = imgUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ads/${publicId}`);
    }

    await ad.deleteOne();
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ad", error: error.message });
  }
};


module.exports = { createAd, getAllAds, getAdById, deleteAd };
