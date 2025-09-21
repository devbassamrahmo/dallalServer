// const express = require('express');
// const router = express.Router();
// const Sponsor = require('../models/Sponsor');
// const upload = require('../middlewares/upload'); // Cloudinary Upload Middleware
// const { protect , isAdmin } = require('../middlewares/authMiddleware');

// // ✅ Upload Sponsor Image (Admin Only)
// router.post('/upload-sponsor', protect , isAdmin , upload.single('image'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded' });
//         }

//         // ✅ Save Cloudinary URL in DB
//         const sponsor = new Sponsor({ imageUrl: req.file.path });
//         await sponsor.save();

//         res.status(201).json({ message: 'Sponsor image uploaded successfully', imageUrl: req.file.path });
//     } catch (error) {
//         res.status(500).json({ message: 'Error uploading sponsor image', error: error.message });
//     }
// });

// router.get('/sponsor-image', async (req, res) => {
//     try {
//         const sponsor = await Sponsor.findOne().sort({ createdAt: -1 }); // Get latest image

//         if (!sponsor) {
//             return res.status(404).json({ message: 'No sponsor image found' });
//         }

//         res.status(200).json({ imageUrl: sponsor.imageUrl });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching sponsor image', error: error.message });
//     }
// });

// module.exports = router;


// routes/admin.js
const express = require('express');
const path = require('path');

const router = express.Router();
const Sponsor = require('../models/Sponsor');
const upload = require('../middlewares/upload'); // Multer memory storage
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { supabase } = require('../config/supabase');

const BUCKET = process.env.SUPABASE_BUCKET || 'ads-images';

// ✅ Upload Sponsor Image (Admin Only)
router.post(
  '/upload-sponsor',
  protect,
  isAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // اسم ملف فريد + مجلّد منظم
      const ext = path.extname(req.file.originalname || '') || '';
      const safeExt = ext.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${safeExt}`;
      const objectPath = `sponsors/${fileName}`;

      const contentType = req.file.mimetype || 'application/octet-stream';
      const fileBuffer = req.file.buffer;

      // رفع إلى Supabase Storage
      const { data: uploadData, error: uploadErr } = await supabase
        .storage
        .from(BUCKET)
        .upload(objectPath, fileBuffer, {
          contentType,
          upsert: false
        });

      if (uploadErr) {
        return res.status(500).json({ message: 'Upload failed', error: uploadErr.message });
      }

      // الحصول على رابط عام (إن كان الباكت Public)
      const { data: publicUrlData } = supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(objectPath);

      const imageUrl = publicUrlData?.publicUrl || null;

      // حفظ بالسكيما الجديدة
      const sponsor = new Sponsor({
        imageUrl: imageUrl || '',   // إذا Private، ممكن نخليها فاضية ونولّد signedUrl لاحقًا عند القراءة
        objectPath,
        bucket: BUCKET,
        contentType
      });

      await sponsor.save();

      return res.status(201).json({
        message: 'Sponsor image uploaded successfully',
        imageUrl: sponsor.imageUrl,
        objectPath: sponsor.objectPath
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error uploading sponsor image', error: error.message });
    }
  }
);

// ✅ Get Latest Sponsor Image
router.get('/sponsor-image', async (req, res) => {
  try {
    const sponsor = await Sponsor.findOne().sort({ createdAt: -1 });

    if (!sponsor) {
      return res.status(404).json({ message: 'No sponsor image found' });
    }

    // إذا الباكت Private، اصنع رابط موقّت بدل publicUrl المخزّن
    const PRIVATE_BUCKET = false; // ← غيّرها إذا خليت الباكت Private في Supabase
    if (PRIVATE_BUCKET) {
      const { data, error } = await supabase
        .storage
        .from(sponsor.bucket || BUCKET)
        .createSignedUrl(sponsor.objectPath, 60 * 60); // ساعة

      if (error) {
        return res.status(500).json({ message: 'Error creating signed URL', error: error.message });
      }

      return res.status(200).json({ imageUrl: data.signedUrl });
    }

    // إذا Public: نرجّع الرابط المخزّن
    return res.status(200).json({ imageUrl: sponsor.imageUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching sponsor image', error: error.message });
  }
});

router.delete('/sponsor-image', protect, isAdmin, async (req, res) => {
  try {
    const sponsor = await Sponsor.findOne().sort({ createdAt: -1 });
    if (!sponsor) return res.status(404).json({ message: 'No sponsor image found' });

    const { error: removeErr } = await supabase
      .storage
      .from(sponsor.bucket || BUCKET)
      .remove([sponsor.objectPath]);

    if (removeErr) {
      return res.status(500).json({ message: 'Error deleting image from storage', error: removeErr.message });
    }

    await Sponsor.deleteOne({ _id: sponsor._id });

    res.json({ message: 'Sponsor image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting sponsor image', error: error.message });
  }
});

module.exports = router;
