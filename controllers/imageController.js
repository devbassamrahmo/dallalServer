const Image = require('../models/sponsImage');
const { cloudinary } = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
    try { 
      const result = await cloudinary.uploader.upload(req.file.path);
      const image = new Image({
        url: result.secure_url,
        public_id: result.public_id,
      });
      await image.save();
      res.status(201).json({ message: 'Image uploaded successfully', image });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getImage = async (req, res) => {
  try {
    const images = await Image.find();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};