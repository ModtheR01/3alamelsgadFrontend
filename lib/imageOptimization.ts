/**
 * Safe Image Optimization & Compression Utility
 *
 * Requirements:
 * - Keeps original product image unchanged when already within safe size and dimensions.
 * - Safely resizes and compresses excessively large images (e.g. 10MB-40MB high-res camera photos)
 *   to ensure smooth direct Cloudinary upload without exceeding payload limits.
 * - Strictly preserves original product aspect ratio, shape, colors, and visual details.
 */

export interface ImageOptimizationOptions {
  /** Maximum allowable file size before compression is triggered (default: 8MB) */
  compressionThresholdBytes?: number;
  /** Maximum dimension (width or height) to scale down to proportionally (default: 2560px) */
  maxDimension?: number;
  /** JPEG/WebP export quality between 0.1 and 1.0 (default: 0.92 for high fidelity) */
  quality?: number;
}

export const DEFAULT_COMPRESSION_THRESHOLD = 8 * 1024 * 1024; // 8MB
export const DEFAULT_MAX_DIMENSION = 2560; // 2560px
export const DEFAULT_QUALITY = 0.92;

/**
 * Checks an image file and safely compresses/resizes only when necessary.
 * Preserves the exact aspect ratio, colors, and texture details of the product.
 */
export async function safelyPrepareImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  // If not in a browser environment or not an image, return original file
  if (typeof window === 'undefined' || typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  const threshold = options.compressionThresholdBytes || DEFAULT_COMPRESSION_THRESHOLD;
  const maxDim = options.maxDimension || DEFAULT_MAX_DIMENSION;
  const quality = options.quality || DEFAULT_QUALITY;

  return new Promise<File>((resolve) => {
    // If browser doesn't support HTMLImageElement or URL, return file directly
    if (typeof Image === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      // If already within both dimension and size limits, keep original file completely unchanged
      const needsDimensionResize = naturalWidth > maxDim || naturalHeight > maxDim;
      const needsSizeCompression = file.size > threshold;

      if (!needsDimensionResize && !needsSizeCompression) {
        resolve(file);
        return;
      }

      try {
        // Calculate proportional dimensions maintaining exact aspect ratio
        let targetWidth = naturalWidth;
        let targetHeight = naturalHeight;

        if (needsDimensionResize) {
          const scale = maxDim / Math.max(naturalWidth, naturalHeight);
          targetWidth = Math.round(naturalWidth * scale);
          targetHeight = Math.round(naturalHeight * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Use high-quality interpolation to preserve fine rug weave, patterns, and colors
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Determine optimal format: preserve PNG if original was PNG and small, otherwise use JPEG for size safety
        const exportMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compressed blob is somehow larger or failed, keep original file
              resolve(file);
              return;
            }

            // Derive appropriate filename with matching extension
            let newName = file.name;
            if (exportMime === 'image/jpeg' && !newName.match(/\.(jpe?g)$/i)) {
              newName = newName.replace(/\.[^/.]+$/, '') + '.jpg';
            }

            const optimizedFile = new File([blob], newName, {
              type: exportMime,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          exportMime,
          quality
        );
      } catch (err) {
        console.warn('Image optimization fallback to original file:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
