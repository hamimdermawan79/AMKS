/**
 * Client-side image compression utility.
 * Resizes large camera photos to a max dimension and compresses them
 * in-browser using HTML5 Canvas before uploading to the server.
 */
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressClientImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // If already very small (< 250 KB) and acceptable type, skip canvas processing
  if (file.size <= 250 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png')) {
    return { file, originalSize, compressedSize: file.size };
  }

  return new Promise((resolve) => {
    // If running in non-browser environment, fallback
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ file, originalSize, compressedSize: file.size });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ file, originalSize, compressedSize: file.size });
            return;
          }

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ file, originalSize, compressedSize: file.size });
                return;
              }

              // Create new compressed File object
              const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const newFileName = `${baseName}_optimized${ext}`;

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize: compressedFile.size,
              });
            },
            mimeType,
            quality
          );
        } catch (err) {
          console.error('Client compression failed, using original file:', err);
          resolve({ file, originalSize, compressedSize: file.size });
        }
      };

      img.onerror = () => {
        resolve({ file, originalSize, compressedSize: file.size });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({ file, originalSize, compressedSize: file.size });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human-readable string (e.g. "2.4 MB", "320 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
