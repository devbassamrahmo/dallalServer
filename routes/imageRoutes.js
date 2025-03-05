const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const imageController = require('../controllers/imageController');

const upload = multer({ storage });

router.post('/upload', upload.single('image'), imageController.uploadImage);
router.get('/images', imageController.getImage);

module.exports = router;