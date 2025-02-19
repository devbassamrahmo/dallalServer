const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createAd, getAllAds, getAdById, deleteAd } = require("../controllers/adController");

// ✅ Public Routes
router.get("/", getAllAds);
router.get("/:id", getAdById);

// ✅ Protected Routes (Authenticated Users Only)
router.post("/", protect, createAd);
router.delete("/:id", protect, deleteAd);

module.exports = router;
