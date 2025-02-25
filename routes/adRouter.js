const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createAd, getAllAds, getAdById, deleteAd } = require("../controllers/adController");
const upload = require("../middlewares/multer");
// ✅ Public Routes
router.get("/", getAllAds);
router.get("/:id", getAdById);

// ✅ Protected Routes (Authenticated Users Only)
router.post("/", protect, upload.array("images", 5), createAd);
router.delete("/:id", protect, deleteAd);
//baseURL/ad/:id
module.exports = router;
