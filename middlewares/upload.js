// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

// // ✅ Configure Multer Storage with Cloudinary
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'listings_images', // Cloudinary folder name
//         format: async (req, file) => 'png', // Convert to PNG
//         public_id: (req, file) => `${Date.now()}-${file.originalname}`,
//     },
// });

// const upload = multer({ storage });

// module.exports = upload;


// middlewares/upload.js
const multer = require('multer');

const fileFilter = (req, file, cb) => {
  // اسمح بأنواع الصور الشائعة فقط
  const ok = /image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype);
  if (!ok) return cb(new Error('نوع الملف غير مدعوم. الرجاء رفع صورة.'), false);
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
