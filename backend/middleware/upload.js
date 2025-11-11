const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================================
// MEMORY STORAGE (for face recognition - no file saved)
// ============================================================
const memoryStorage = multer.memoryStorage();

// ============================================================
// DISK STORAGE (for other uploads like avatars, courses, etc.)
// ============================================================
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'others';
    
    if (file.fieldname === 'faceImage') {
      folder = 'faces';
    } else if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'courseImage') {
      folder = 'courses';
    } else if (file.fieldname === 'blogImage') {
      folder = 'blog';
    }
    
    const dest = path.join(uploadDir, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
  }
};

// ============================================================
// UPLOAD MIDDLEWARES
// ============================================================

// Memory upload (for face recognition - file in req.file.buffer, NOT SAVED)
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Disk upload (for avatars, courses, blog - file SAVED to disk)
const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// ============================================================
// EXPORTS
// ============================================================

// Default export: memory storage (for face recognition)
module.exports = uploadMemory;

// Named exports for specific use cases
module.exports.uploadMemory = uploadMemory;
module.exports.uploadDisk = uploadDisk;

// Pre-configured middleware
module.exports.uploadFaceImage = uploadMemory.single('image'); // Face: memory only
module.exports.uploadAvatar = uploadDisk.single('avatar');     // Avatar: save to disk
module.exports.uploadCourseImage = uploadDisk.single('courseImage');
module.exports.uploadBlogImage = uploadDisk.single('blogImage');
