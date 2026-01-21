/**
 * Image Optimizer Middleware
 *
 * Automatically converts uploaded JPG/PNG images to WebP format for better compression
 * Runs after file upload is complete
 *
 * Features:
 * - Auto-generates WebP versions of uploaded images
 * - Maintains original files (non-destructive)
 * - Skips images already in optimal formats (WebP, AVIF, SVG)
 * - Logs optimization results
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface UploadedFile {
  id?: number;
  name: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    await next();

    // Only process upload endpoints
    if (!ctx.request.url.includes('/upload') && !ctx.request.url.includes('/api/upload')) {
      return;
    }

    // Only process successful uploads (200 or 201)
    if (ctx.status !== 200 && ctx.status !== 201) {
      return;
    }

    try {
      const files = ctx.response.body;

      if (Array.isArray(files)) {
        // Multiple files uploaded
        for (const file of files) {
          await optimizeImage(file, strapi);
        }
      } else if (files && files.url) {
        // Single file uploaded
        await optimizeImage(files, strapi);
      }
    } catch (error) {
      // Don't fail the request if optimization fails
      console.error('❌ Image optimization error:', error);
    }
  };
};

/**
 * Optimize a single uploaded image
 */
async function optimizeImage(file: UploadedFile, strapi: any): Promise<void> {
  // Skip if not an image
  if (!file.mime?.startsWith('image/')) {
    return;
  }

  // Skip if already optimized format
  const optimizedFormats = ['image/webp', 'image/avif', 'image/svg+xml'];
  if (optimizedFormats.includes(file.mime)) {
    console.log(`⏭️  Skipping ${file.name} (already optimized: ${file.mime})`);
    return;
  }

  // Skip if file doesn't exist
  const publicDir = strapi.dirs?.public || path.resolve(process.cwd(), '../public');
  const filePath = path.join(publicDir, file.url);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found for optimization: ${filePath}`);
    return;
  }

  try {
    const fileExtension = path.extname(filePath).toLowerCase();

    // Only convert JPG/PNG to WebP and AVIF
    if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      const stats = fs.statSync(filePath);
      const originalSizeKB = (stats.size / 1024).toFixed(2);

      // Generate WebP version
      const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await sharp(filePath)
        .webp({
          quality: 80,
          effort: 6, // Higher effort = better compression (0-6)
        })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      const webpSizeKB = (webpStats.size / 1024).toFixed(2);
      const webpSavings = ((1 - webpStats.size / stats.size) * 100).toFixed(1);

      console.log(
        `✅ Generated WebP: ${path.basename(webpPath)} ` +
        `(${originalSizeKB}KB → ${webpSizeKB}KB, ${webpSavings}% smaller)`
      );

      // Generate AVIF version (20-30% smaller than WebP)
      const avifPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.avif');
      await sharp(filePath)
        .avif({
          quality: 80,
          effort: 6, // Higher effort = better compression (0-9, but 6 is good)
        })
        .toFile(avifPath);

      const avifStats = fs.statSync(avifPath);
      const avifSizeKB = (avifStats.size / 1024).toFixed(2);
      const avifSavings = ((1 - avifStats.size / stats.size) * 100).toFixed(1);

      console.log(
        `✅ Generated AVIF: ${path.basename(avifPath)} ` +
        `(${originalSizeKB}KB → ${avifSizeKB}KB, ${avifSavings}% smaller)`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to optimize ${file.name}:`, error);
  }
}
