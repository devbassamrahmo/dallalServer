// const Image = require('../models/Sponsor');
// const { cloudinary } = require('../config/cloudinary');

// exports.uploadImage = async (req, res) => {
//     try { 
//       const result = await cloudinary.uploader.upload(req.file.path);
//       const image = new Image({
//         url: result.secure_url,
//         public_id: result.public_id,
//       });
//       await image.save();
//       res.status(201).json({ message: 'Image uploaded successfully', image });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };

// exports.getImage = async (req, res) => {
//   try {
//     const images = await Image.find();
//     res.status(200).json(images);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/sponsor.controller.js
const fs = require('fs').promises;
const path = require('path');
const Image = require('../models/Sponsor');
const { supabase } = require('../config/supabase');

const BUCKET = process.env.SUPABASE_BUCKET || 'sponsor-images';

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لا يوجد ملف مرسل' });
    }

    // اسم ملف آمن داخل الباكت
    const ext = path.extname(req.file.originalname) || '';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const objectPath = `sponsors/${fileName}`;

    // جهّز البفر (حسب نوع تخزين multer)
    let fileBuffer;
    let contentType = req.file.mimetype || 'application/octet-stream';

    if (req.file.buffer) {
      // memoryStorage (مناسب لـ Vercel)
      fileBuffer = req.file.buffer;
    } else if (req.file.path) {
      // diskStorage
      fileBuffer = await fs.readFile(req.file.path);
    } else {
      return res.status(400).json({ error: 'تعذّر قراءة الملف' });
    }

    // رفع إلى Supabase Storage
    const { data: uploadRes, error: uploadErr } = await supabase
      .storage
      .from(BUCKET)
      .upload(objectPath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (uploadErr) {
      return res.status(500).json({ error: uploadErr.message });
    }

    // رابط عام (إذا الباكت Public). إذا Private، ممكن تستخدم createSignedUrl بالـ getImage.
    const { data: publicUrlData } = supabase
      .storage
      .from(BUCKET)
      .getPublicUrl(objectPath);

    const imageDoc = new Image({
      // لو كان عندك حقول مختلفة بالموديل عدّلها هون
      url: publicUrlData.publicUrl, // لحا تستخدمه مباشرة إذا الباكت Public
      public_id: objectPath,        // منسجّل المسار كمُعرّف
      bucket: BUCKET,
      contentType
    });

    await imageDoc.save();

    // تنظيف ملف مؤقت إن وُجد
    if (req.file.path) {
      try { await fs.unlink(req.file.path); } catch (_) {}
    }

    res.status(201).json({ message: 'تم الرفع بنجاح', image: imageDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getImage = async (req, res) => {
  try {
    const images = await Image.find().lean();

    // إذا الباكت Private وبدك روابط موقّتة:
    // فعِّل الكود التالي بدل الإرجاع المباشر.
    const isPrivateBucket = false; // غيّرها حسب إعدادك
    if (isPrivateBucket) {
      const signed = await Promise.all(
        images.map(async (img) => {
          const objectPath = img.public_id; // خزّناه فوق كـ path
          const { data, error } = await supabase
            .storage
            .from(img.bucket || BUCKET)
            .createSignedUrl(objectPath, 60 * 60); // صلاحية 1 ساعة

          return {
            ...img,
            url: error ? img.url : data.signedUrl
          };
        })
      );
      return res.status(200).json(signed);
    }

    // إذا الباكت Public (الأبسط)
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
