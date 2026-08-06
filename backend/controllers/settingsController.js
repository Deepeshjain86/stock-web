import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { masterPool } from '../config/tenantDb.js';
import { logActivity } from '../utils/activityLogger.js';

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantFolder = req.tenantDbName || (req.tenantId ? `tenant_${req.tenantId}` : 'common');
    const targetDir = path.join('uploads', 'tenants', tenantFolder, 'logos');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const logoFileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|jfif|pjpeg|pjp|png|webp|avif|gif|svg|bmp|tiff|tif|heic|heif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isMimeImage = file.mimetype && file.mimetype.startsWith('image/');
  const isExtImage = allowedExts.test(ext);

  if (isMimeImage || isExtImage) {
    return cb(null, true);
  }
  cb(new Error('Invalid image file format. Allowed formats: PNG, JPG, JPEG, JFIF, WEBP, SVG, AVIF.'));
};

export const logoUploadMulter = multer({
  storage: logoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: logoFileFilter
});

// @desc    Get all settings keys for tenant
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    const [settings] = await req.db.query('SELECT `key`, `value` FROM settings');
    
    // Format to a key-value object
    const settingsObj = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }

    return res.status(200).json({ success: true, settings: settingsObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload shop logo image
// @route   POST /api/settings/upload-logo
// @access  Private (Admin only)
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const logoUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    // Update settings table in active tenant DB
    await req.db.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['store_logo', logoUrl, logoUrl]
    );
    await req.db.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['logo_url', logoUrl, logoUrl]
    );

    // Update master database tenant record if available
    if (req.tenantId) {
      try {
        await masterPool.query('UPDATE tenants SET logo_url = ? WHERE id = ?', [logoUrl, req.tenantId]);
      } catch (e) {
        console.warn('Failed to update tenant logo_url in master database:', e);
      }
    }

    await logActivity(req.user.id, 'Upload Shop Logo', 'Settings', `Uploaded new store logo: ${logoUrl}`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Shop logo uploaded successfully',
      logo_url: logoUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings bulk for tenant
// @route   PUT /api/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const settingsData = req.body; // Key-value object

    if (settingsData.store_phone || settingsData.phone) {
      const phoneVal = settingsData.store_phone || settingsData.phone;
      const cleaned = String(phoneVal).replace(/\D/g, '');
      if (cleaned.length !== 10) {
        connection.release();
        return res.status(400).json({ success: false, message: 'Store Phone / Contact number must be exactly 10 digits' });
      }
      if (settingsData.store_phone) settingsData.store_phone = cleaned;
      if (settingsData.phone) settingsData.phone = cleaned;
    }

    for (const [key, value] of Object.entries(settingsData)) {
      await connection.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, String(value), String(value)]
      );
    }

    // Also sync logo_url or store_name to master tenants table if provided
    if (req.tenantId && (settingsData.store_name || settingsData.logo_url || settingsData.store_logo)) {
      try {
        const logo = settingsData.logo_url || settingsData.store_logo;
        if (settingsData.store_name && logo) {
          await masterPool.query('UPDATE tenants SET store_name = ?, logo_url = ? WHERE id = ?', [settingsData.store_name, logo, req.tenantId]);
        } else if (settingsData.store_name) {
          await masterPool.query('UPDATE tenants SET store_name = ? WHERE id = ?', [settingsData.store_name, req.tenantId]);
        } else if (logo) {
          await masterPool.query('UPDATE tenants SET logo_url = ? WHERE id = ?', [logo, req.tenantId]);
        }
      } catch (e) {
        console.warn('Failed to update master tenant record:', e);
      }
    }

    await connection.commit();

    await logActivity(req.user.id, 'Update Settings', 'Settings', 'Updated application configuration settings.', req.ip);

    return res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get all warehouses for tenant
// @route   GET /api/settings/warehouses
// @access  Private
export const getWarehouses = async (req, res, next) => {
  try {
    const [warehouses] = await req.db.query('SELECT * FROM warehouses ORDER BY name ASC');
    return res.status(200).json({ success: true, count: warehouses.length, warehouses });
  } catch (error) {
    next(error);
  }
};
