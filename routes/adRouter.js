const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createAd, getAllAds, getAdById, updateAd, deleteAd } = require("../controllers/adController");

// ✅ Public Route: Get All Ads
router.get("/", getAllAds);

// ✅ Public Route: Get a Single Ad
router.get("/:id", getAdById);

// ✅ Protected Routes (Only Authenticated Users)
router.post("/", protect, createAd);
router.put("/:id", protect, updateAd);
router.delete("/:id", protect, deleteAd);

module.exports = router;
