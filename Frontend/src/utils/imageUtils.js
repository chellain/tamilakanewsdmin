// Utility helpers for converting image files to optimized WebP data URLs.

export async function fileToWebPDataUrl(file, options = {}) {
  const { maxWidth = 800, quality = 0.8 } = options;

  const toCanvasDataUrl = async (img) => {
    const scale = maxWidth && img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/webp", quality);
  };

  try {
    // Modern browsers: convert directly from File/Blob
    const bitmap = await createImageBitmap(file);
    return await toCanvasDataUrl(bitmap);
  } catch (e) {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await toCanvasDataUrl(img);
            resolve(result);
          } catch (innerErr) {
            reject(innerErr);
          }
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
