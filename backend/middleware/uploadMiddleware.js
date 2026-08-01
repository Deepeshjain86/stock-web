import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantFolder = req.tenantDbName || (req.tenantId ? `tenant_${req.tenantId}` : 'common');
    const targetDir = path.join('uploads', 'tenants', tenantFolder, 'products');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|jfif|pjpeg|pjp|png|webp|avif|gif|svg|bmp|tiff|tif|heic|heif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isMimeImage = file.mimetype && file.mimetype.startsWith('image/');
  const isExtImage = allowedExts.test(ext);

  if (isMimeImage || isExtImage) {
    return cb(null, true);
  }
  cb(new Error('Only valid image files (JPG, JPEG, JFIF, PNG, WEBP, AVIF, GIF, SVG, BMP) are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: fileFilter
});

export default upload;
