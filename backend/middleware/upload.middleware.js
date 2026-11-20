const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads/temp directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File type validator for book cover
const bookCoverFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed for book cover'));
  }
};

// File type validator for ID document
const idDocumentFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed for ID document'));
  }
};

// File type validator for profile image
const profileImageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed for profile image'));
  }
};

// Book cover upload: 5MB max
const uploadBookCover = multer({
  storage: storage,
  fileFilter: bookCoverFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('cover_image');

// ID document upload: 10MB max
const uploadIDDocument = multer({
  storage: storage,
  fileFilter: idDocumentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('id_document');

// Profile image upload: 5MB max
const uploadProfileImage = multer({
  storage: storage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('profile_image');

module.exports = {
  uploadBookCover,
  uploadIDDocument,
  uploadProfileImage
};
