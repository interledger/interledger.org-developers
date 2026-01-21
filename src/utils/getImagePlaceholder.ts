/**
 * Generate a blur-up placeholder for images
 * Creates a tiny, blurred version of the image as a base64 data URI
 *
 * Usage:
 *   const placeholder = await getImagePlaceholder('/uploads/image.jpg');
 *   // Returns: "data:image/webp;base64,..."
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface PlaceholderOptions {
  width?: number;
  quality?: number;
}

/**
 * Generate a tiny blurred placeholder image
 */
export async function getImagePlaceholder(
  imagePath: string,
  options: PlaceholderOptions = {}
): Promise<string> {
  const { width = 20, quality = 20 } = options;

  try {
    // Resolve absolute path
    const publicDir = path.join(process.cwd(), 'public');
    const absolutePath = imagePath.startsWith('/')
      ? path.join(publicDir, imagePath)
      : imagePath;

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Placeholder: Image not found: ${absolutePath}`);
      return '';
    }

    // Generate tiny blurred version
    const buffer = await sharp(absolutePath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .blur(2)
      .webp({ quality })
      .toBuffer();

    // Convert to base64 data URI
    const base64 = buffer.toString('base64');
    return `data:image/webp;base64,${base64}`;
  } catch (error) {
    console.error(`Failed to generate placeholder for ${imagePath}:`, error);
    return '';
  }
}

/**
 * Generate placeholder with dominant color
 */
export async function getImageDominantColor(imagePath: string): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const absolutePath = imagePath.startsWith('/')
      ? path.join(publicDir, imagePath)
      : imagePath;

    if (!fs.existsSync(absolutePath)) {
      return '#e5e7eb'; // Default gray
    }

    // Get dominant color
    const { dominant } = await sharp(absolutePath).stats();

    // Convert RGB to hex
    const r = dominant.r.toString(16).padStart(2, '0');
    const g = dominant.g.toString(16).padStart(2, '0');
    const b = dominant.b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  } catch (error) {
    console.error(`Failed to get dominant color for ${imagePath}:`, error);
    return '#e5e7eb';
  }
}

/**
 * Generate CSS gradient placeholder from image
 */
export async function getImageGradientPlaceholder(imagePath: string): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const absolutePath = imagePath.startsWith('/')
      ? path.join(publicDir, imagePath)
      : imagePath;

    if (!fs.existsSync(absolutePath)) {
      return 'linear-gradient(to bottom, #e5e7eb, #d1d5db)';
    }

    // Resize to 2x2 to get corner colors
    const { data, info } = await sharp(absolutePath)
      .resize(2, 2, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Extract corner colors
    const topLeft = rgbToHex(data[0], data[1], data[2]);
    const topRight = rgbToHex(data[3], data[4], data[5]);
    const bottomLeft = rgbToHex(data[6], data[7], data[8]);
    const bottomRight = rgbToHex(data[9], data[10], data[11]);

    // Create gradient
    return `linear-gradient(135deg, ${topLeft}, ${topRight}, ${bottomRight}, ${bottomLeft})`;
  } catch (error) {
    console.error(`Failed to generate gradient for ${imagePath}:`, error);
    return 'linear-gradient(to bottom, #e5e7eb, #d1d5db)';
  }
}

/**
 * Helper: Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
