const multer = require('multer');
const path = require('path');

// Allowed file types
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed'
];

// Common file filter
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, PNG, or Zip files are allowed!'), false);
  }
};

// --- Upload for general books (original setup) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/')); 
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, fileFilter });

// --- Upload for book user reviews ---
const reviewStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/reviews/')); 
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const reviewUpload = multer({ storage: reviewStorage, fileFilter });

module.exports = {
  upload,         // For book versions, covers, etc.
  reviewUpload    // For user-submitted reviews
};