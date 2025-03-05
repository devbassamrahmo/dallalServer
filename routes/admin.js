const express = require('express');
const router = express.Router();
const Sponsor = require('../models/Sponsor');
const upload = require('../middlewares/upload'); // Cloudinary Upload Middleware
const { protect , isAdmin } = require('../middlewares/authMiddleware');

// ✅ Upload Sponsor Image (Admin Only)
router.post('/upload-sponsor', protect , isAdmin , upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // ✅ Save Cloudinary URL in DB
        const sponsor = new Sponsor({ imageUrl: req.file.path });
        await sponsor.save();

        res.status(201).json({ message: 'Sponsor image uploaded successfully', imageUrl: req.file.path });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading sponsor image', error: error.message });
    }
});

router.get('/sponsor-image', async (req, res) => {
    try {
        const sponsor = await Sponsor.findOne().sort({ createdAt: -1 }); // Get latest image

        if (!sponsor) {
            return res.status(404).json({ message: 'No sponsor image found' });
        }

        res.status(200).json({ imageUrl: sponsor.imageUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sponsor image', error: error.message });
    }
});

module.exports = router;
