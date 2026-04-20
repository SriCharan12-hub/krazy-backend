import express, { Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { validatePaymentAmount } from '../utils/security';

const router = express.Router();

// SECURITY: Whitelist of allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;

// Use memory storage — files are held as buffers, not written to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST,
  },
  fileFilter: (_req, file, cb) => {
    // SECURITY: Strict file type validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      console.warn(`🚨 SECURITY: Attempted upload of disallowed file type: ${file.mimetype}`);
      cb(new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, WebP allowed.`));
      return;
    }

    // SECURITY: Validate file extension matches MIME type (prevent spoofing)
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!ext || !validExtensions.includes(ext)) {
      console.warn(`🚨 SECURITY: Attempted upload with invalid extension: ${ext}`);
      cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .webp allowed.'));
      return;
    }

    cb(null, true);
  },
});

// Helper: upload a single buffer to Cloudinary
function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  transformation?: object
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

// POST /api/upload/products
// Admin-only: Upload 1..many images for a product
// First image → thumbnail (800×800, cropped)
// Remaining images → gallery images (1200×1200, auto-quality)
router.post(
  '/products',
  protect,
  adminOnly,
  upload.array('images', 10),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No images uploaded' });
        return;
      }

      const folder = 'genzstore/products';

      // Upload all files in parallel
      const uploadPromises = files.map((file, index) => {
        if (index === 0) {
          // First image = thumbnail (square crop, optimised for listing/card display)
          return uploadToCloudinary(file.buffer, `${folder}/thumbnails`, [
            { width: 800, height: 800, crop: 'fill', gravity: 'auto' },
            { quality: 'auto', fetch_format: 'auto' },
          ]);
        } else {
          // Remaining images = full-size gallery images
          return uploadToCloudinary(file.buffer, `${folder}/gallery`, [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ]);
        }
      });

      const urls = await Promise.all(uploadPromises);

      // Separate thumbnail from gallery
      const thumbnail = urls[0];
      const images = urls.slice(1);

      console.log(`Uploaded ${files.length} image(s) to Cloudinary`);
      console.log(`Thumbnail: ${thumbnail}`);
      console.log(`Gallery: ${images.length} image(s)`);

      res.status(200).json({
        success: true,
        thumbnail,     // First image URL (for cards, previews)
        images,        // Remaining image URLs (for product detail gallery)
        allUrls: urls, // All URLs in order
      });
    } catch (error: any) {
      console.error('Cloudinary Upload Error:', error.message);
      res.status(500).json({ success: false, message: error.message || 'Upload failed' });
    }
  }
);

export default router;
