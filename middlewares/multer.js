const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ✅ Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ads", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});



// const upload = multer({ storage });
const upload = multer({ dest: 'temp/' });
module.exports = upload;
