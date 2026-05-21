const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

// ── Cloudinary storage ────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'animal_rescue',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMime = /^image\/(jpeg|png|webp)$/;
  if (allowedMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed.'), false);
  }
};

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Named upload middlewares ──────────────────────────────────────────────────
const uploadPhotos = upload.array('photos', 3);       // Report rescue: up to 3 photos
const uploadSingle = upload.single('completionPhoto'); // Status update: 1 proof photo

// ── Error handler (must be used AFTER upload middleware in route) ─────────────
const multerError = (err, req, res, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum allowed size is 5 MB.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Too many files. Maximum is 3 photos.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field name.' });
  }
  // Cloudinary / format / other errors
  return res.status(400).json({ message: err.message || 'File upload failed.' });
};

module.exports = { uploadPhotos, uploadSingle, multerError };
