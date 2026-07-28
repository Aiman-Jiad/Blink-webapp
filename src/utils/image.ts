// ============================================================================
// Image optimization utilities for profile pictures.
// ============================================================================

/**
 * Load an image File into an HTMLImageElement (for cropping / preview).
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

/**
 * Crop and optimize an image to a square data URL (JPEG).
 *
 * Uses canvas to:
 * - Draw the source image at the given offset and zoom
 * - Crop to a centered square
 * - Downscale to `targetSize` (default 256px — crisp for retina at 128px display)
 * - Encode as quality-0.85 JPEG (typically 10-30KB vs 200KB+ for raw photos)
 *
 * Returns a data URL string suitable for storing as photoURL.
 */
export function cropAndOptimize(
  img: HTMLImageElement,
  zoom: number,
  offsetX: number,
  offsetY: number,
  targetSize = 256,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill white background (for PNG transparency)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Source crop dimensions: a square region from the image
  const minDim = Math.min(img.naturalWidth, img.naturalHeight);
  const sourceSize = minDim / Math.max(zoom, 1);
  const sx = offsetX * img.naturalWidth;
  const sy = offsetY * img.naturalHeight;

  // Draw the cropped, scaled image
  ctx.drawImage(
    img,
    sx, sy, sourceSize, sourceSize,
    0, 0, targetSize, targetSize,
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generate a data URL from a File for preview before cropping.
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
