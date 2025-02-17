const express = require("express");
const router = express.Router();
const cors = require("cors");
const { createAd, getAllAds, getAdById, updateAd, deleteAd } = require("../controllers/adController");

router.use(cors());

router.post("/", createAd);
router.get("/", getAllAds);
router.get("/:id", getAdById);
router.put("/:id", updateAd);
router.delete("/:id", deleteAd);

module.exports = router;
