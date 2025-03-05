const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); // Multer with Cloudinary
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// ✅ Upload Image to Cloudinary (Admin Only)
router.post('/upload-image', protect, isAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.status(201).json({
            message: 'Image uploaded successfully',
            imageUrl: req.file.path, // ✅ Cloudinary URL
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
});

// router.get('/all-images', protect , isAdmin, async (req, res) => {
//     try {
//         // ✅ Fetch all ads and extract image URLs
//         const ads = await Ad.find({}, 'images');
//         console.log(ads)
//         // ✅ Flatten & filter images
//         const allImages = ads.flatMap(ad => ad.images).filter(Boolean);

//         if (allImages.length === 0) {
//             return res.status(404).json({ message: 'No images found' });
//         }

//         res.status(200).json({ images: allImages });
//     } catch (error) {
//         console.error('Error fetching images:', error);
//         res.status(500).json({ message: 'Error fetching images', error: error.message });
//     }
// });

module.exports = router;
