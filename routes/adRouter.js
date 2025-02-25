const express = require("express");
const router = express.Router();
const { protect , isAdmin} = require("../middlewares/authMiddleware");
const { createAd, getAllAds, getAdById, deleteAd , refreshAd , approveAd } = require("../controllers/adController");
const upload = require("../middlewares/multer");
// ✅ Public Routes
router.get("/", getAllAds);
router.get("/:id", getAdById);

// ✅ Protected Routes (Authenticated Users Only)
router.post("/", protect, upload.array("images", 5), createAd);
router.post("/:id/refresh", protect, refreshAd);
router.delete("/:id", protect, deleteAd);

// ✅ Admin Routes
router.put("/:id/approve", protect, isAdmin, approveAd);
module.exports = router;
