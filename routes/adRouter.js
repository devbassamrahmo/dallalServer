const express = require("express");
const router = express.Router();
const { protect , isAdmin} = require("../middlewares/authMiddleware");
const { createAd, getAllAds, getAdById, deleteAd , refreshAd , approveAd , getUserAds , deleteByAdmin , getAllAdsAdmin , getPendingPosts , approveAll , rejectAll , updateAd} = require("../controllers/adController");
const upload = require("../middlewares/multer");

// ✅ Public Routes
router.get("/", getAllAds);
router.get("/my-ads", protect, getUserAds);
router.get("/:id", getAdById);

// ✅ Protected Routes (Authenticated Users Only)
router.post("/", protect, upload.array("images", 5), createAd);
router.post("/:id/refresh", protect, refreshAd);
router.delete("/:id", protect, deleteAd);
router.delete('/delete-ad/:adId', protect , isAdmin, deleteByAdmin);
router.get('/find/alladsadmin', protect , isAdmin, getAllAdsAdmin);
router.get('/find/get-pending' , protect , isAdmin , getPendingPosts);
router.put("/:id", protect, upload.array("images", 5), updateAd);

//approve and reject all
router.put('/approve-all' , protect , isAdmin , approveAll)
router.put('/reject-all' , protect , isAdmin , rejectAll)
// ✅ Admin Routes
router.put("/:id/approve", protect, isAdmin, approveAd);

module.exports = router;
