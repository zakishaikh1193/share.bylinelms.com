const multer = require('multer');
const path = require('path');

// Allowed file types
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

// Common file filter
const fileFilter = (req, file, cb) => {
  // Allow CSV, XLS, XLSX files for CSV uploads
  if (file.fieldname === 'csv_file') {
    const fileName = file.originalname.toLowerCase();
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (allowedTypes.includes(file.mimetype) || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, or XLSX files are allowed for uploads!'), false);
    }
    return;
  }
  
  // Original filter for other file types
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