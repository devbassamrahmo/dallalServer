const express = require('express');
const router = express.Router();

const { storage } = require('../config/cloudinary');
const imageController = require('../controllers/imageController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB




router.post('/upload', upload.single('image'), imageController.uploadImage);
router.get('/images', imageController.getImage);

module.exports = router;