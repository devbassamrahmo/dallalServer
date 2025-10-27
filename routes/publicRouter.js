// routes/publicRouter.js
const router = require("express").Router();
const { getPublicUserProfile, getPublicUserAds } = require("../controllers/publicController");

router.get("/users/:idOrUsername", getPublicUserProfile);
router.get("/users/:idOrUsername/ads", getPublicUserAds);

module.exports = router;
// app.js: app.use("/public", require("./routes/publicRouter"));
