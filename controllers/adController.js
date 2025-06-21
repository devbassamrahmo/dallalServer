const Ad = require("../models/Ad");
const { CarAd, BikeAd } = require("../models/CarAd");
const RealEstateAd = require("../models/RealEstateAd");
const ElectronicsAd = require("../models/ElectronicsAd");
const GeneralAd = require("../models/GeneralAd");
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
          condition , adType : req.body.adType
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
    const { search, category, location, minPrice, maxPrice, condition, page = 1, limit = 1000 } = req.query;
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
    const ads = await Ad.find(filter).skip(skip).limit(parseInt(limit)).populate("user", "username email phoneNumber");

    res.status(200).json({ total: ads.length, ads });
  } catch (error) {
    res.status(500).json({ message: "Error fetching ads", error: error.message });
  }
};


// ✅ Get Ad by ID
const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("user", "username email phoneNumber");
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

const deleteByAdmin = async (req , res) =>{
  try {
    const adId = req.params.adId;

    // ✅ Find and delete ad
    const deletedAd = await Ad.findByIdAndDelete(adId);
    if (!deletedAd) {
        return res.status(404).json({ message: 'Ad not found' });
    }

    res.status(200).json({ message: 'Ad deleted successfully', deletedAd });
} catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Error deleting ad', error: error.message });
}
}

const getAllAdsAdmin = async (req,res) =>{
  try{
  const ads = await Ad.find();
  res.status(200).json({ads}) 
  }catch(err){
    console.log(err)
  }
}

const getPendingPosts = async (req, res) =>{
  try {
    // ✅ Fetch ads where status is "pending"
    const pendingAds = await Ad.find({ status: 'pending' });

    if (!pendingAds.length) {
        return res.status(404).json({ message: 'No pending ads found' });
    }

    res.status(200).json(pendingAds);
} catch (error) {
    console.error('Error fetching pending ads:', error);
    res.status(500).json({ message: 'Error fetching pending ads', error: error.message });
}
}


const approveAll = async (req , res) =>{
  
  try {
    const updatedAds = await Ad.updateMany({ status: 'pending' }, { status: 'approved' });

    if (updatedAds.modifiedCount === 0) {
        return res.status(404).json({ message: 'No pending ads found to approve' });
    }

    res.status(200).json({ message: `Approved ${updatedAds.modifiedCount} ads successfully` });
} catch (error) {
    console.error('Error approving ads:', error);
    res.status(500).json({ message: 'Error approving ads', error: error.message });
}};

const rejectAll = async (req , res) =>{
  try {
    const updatedAds = await Ad.updateMany({ status: 'pending' }, { status: 'rejected' });

    if (updatedAds.modifiedCount === 0) {
        return res.status(404).json({ message: 'No pending ads found to reject' });
    }

    res.status(200).json({ message: `Rejected ${updatedAds.modifiedCount} ads successfully` });
} catch (error) {
    console.error('Error rejecting ads:', error);
    res.status(500).json({ message: 'Error rejecting ads', error: error.message });
}}

const updateAd = async (req, res) => {
  try {
    const adId = req.params.id;

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // ✅ تحقق من صلاحية التعديل (المالك أو أدمن)
    if (ad.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this ad" });
    }

    // ✅ تحديث الحقول العامة
    const updatableFields = ["title", "location", "priceSYP", "priceUSD", "description", "condition", "status"];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        ad[field] = req.body[field];
      }
    });

    // ✅ تحديث الصور إذا تم رفع صور جديدة
    if (req.files && req.files.length > 0) {
      // حذف الصور القديمة من Cloudinary
      for (const imgUrl of ad.images) {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`ads/${publicId}`);
      }
      // إضافة الصور الجديدة
      const newImages = req.files.map((file) => file.path);
      ad.images = newImages;
    }

    // ✅ تحديث الحقول الخاصة حسب الفئة
    switch (ad.category) {
      case "car":
      case "bike":
        ad.transmission = req.body.transmission || ad.transmission;
        ad.vehicleType = req.body.vehicleType || ad.vehicleType;
        ad.mileage = req.body.mileage || ad.mileage;
        break;
      case "real_estate":
        ad.propertyType = req.body.propertyType || ad.propertyType;
        ad.deedType = req.body.deedType || ad.deedType;
        if (req.body.newHousingProject !== undefined) {
          ad.newHousingProject = req.body.newHousingProject === "true";
        }
        break;
      case "electronics":
        ad.deviceType = req.body.deviceType || ad.deviceType;
        break;
      case "general":
        ad.adType = req.body.adType || ad.adType;
        break;
    }

    await ad.save();
    res.status(200).json({ message: "Ad updated successfully", ad });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ message: "Error updating ad", error: error.message });
  }
};

module.exports = { createAd, getAllAds, getAdById, deleteAd , approveAd, refreshAd , getUserAds , deleteByAdmin , getAllAdsAdmin , getPendingPosts , approveAll , rejectAll , updateAd};
