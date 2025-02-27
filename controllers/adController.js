const Ad = require("../models/Ad");
const { CarAd, BikeAd } = require("../models/CarAd");
const RealEstateAd = require("../models/RealEstateAd");
const cloudinary = require("../config/cloudinary");
// ✅ Create an Ad Based on Category
const createAd = async (req, res) => {
  try {
    const { title, location, category, priceSYP, priceUSD, description, condition } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const imageUrls = req.files.map((file) => file.path);
    let newAd;

    switch (category) {
      case "car":
        newAd = new CarAd({
          title, location, category, priceSYP, priceUSD, description, images: imageUrls, user: req.user.id,
          condition, transmission: req.body.transmission || "", vehicleType: req.body.vehicleType || "", mileage: req.body.mileage || 0
        });
        break;

      case "bike":
        newAd = new BikeAd({
          title, location, category, priceSYP, priceUSD, description, images: imageUrls, user: req.user.id,
          condition, transmission: req.body.transmission || "", vehicleType: req.body.vehicleType || "", mileage: req.body.mileage || 0
        });
        break;

      case "real_estate":
        newAd = new RealEstateAd({
          title, location, category, priceSYP, priceUSD, description, images: imageUrls, user: req.user.id,
          condition, propertyType: req.body.propertyType || "", deedType: req.body.deedType || "", newHousingProject: req.body.newHousingProject === "true"
        });
        break;

      case "electronics":
        newAd = new ElectronicsAd({
          title, location, category, priceSYP, priceUSD, description, images: imageUrls, user: req.user.id,
          condition, deviceType: req.body.deviceType || ""
        });
        break;

      default:
        newAd = new GeneralAd({
          title, location, category, priceSYP, priceUSD, description, images: imageUrls, user: req.user.id,
          condition, adType: req.body.adType || ""
        });
    }

    await newAd.save();
    res.status(201).json({ message: "Ad submitted for approval", ad: newAd });
  } catch (error) {
    res.status(500).json({ message: "Error creating ad", error: error.message });
  }
};

const getUserAds = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    const userAds = await Ad.find({ user: req.user.id });

    res.status(200).json({ total: userAds.length, ads: userAds });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user ads", error: error.message });
  }
};

const approveAd = async (req, res) => {
  try {
    const { status } = req.body; // "approved" or "rejected"

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.status = status;
    await ad.save();

    res.status(200).json({ message: `Ad ${status} successfully`, ad });
  } catch (error) {
    res.status(500).json({ message: "Error approving ad", error: error.message });
  }
};

const refreshAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to refresh this ad" });
    }

    const daysLeft = Math.ceil((ad.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    if (daysLeft > 5) {
      return res.status(400).json({ message: "You can only refresh the ad in the last 5 days." });
    }

    ad.expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // Reset to 15 days
    await ad.save();

    res.status(200).json({ message: "Ad refreshed successfully", ad });
  } catch (error) {
    res.status(500).json({ message: "Error refreshing ad", error: error.message });
  }
};

// ✅ Get All Ads
const getAllAds = async (req, res) => {
  try {
    const { search, category, location, minPrice, maxPrice, condition, page = 1, limit = 10 } = req.query;
    let filter = { status: "approved" }; // ✅ Show only approved ads

    // 🔍 Search by Title or Description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // 🎯 Filter by Category
    if (category) filter.category = category;

    // 📍 Filter by Location
    if (location) filter.location = { $regex: location, $options: "i" };

    // 💰 Filter by Price Range
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

    // ✅ Filter by Condition (new, used, furnished, etc.)
    if (condition) filter.condition = condition;

    // 📌 Pagination
    const skip = (page - 1) * limit;

    // 🔥 Get Ads with Filters
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


module.exports = { createAd, getAllAds, getAdById, deleteAd , approveAd, refreshAd , getUserAds};
