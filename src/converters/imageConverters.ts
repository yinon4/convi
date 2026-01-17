// Image conversion function
const convertImage = async (
  file: File,
  targetType: string,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    onProgress?.(10); // Starting image load

    const img = new Image();
    img.onload = () => {
      onProgress?.(50); // Image loaded, starting canvas operations

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      onProgress?.(75); // Canvas setup complete, starting draw

      ctx.drawImage(img, 0, 0);

      onProgress?.(90); // Draw complete, starting blob conversion

      canvas.toBlob((blob) => {
        if (blob) {
          onProgress?.(100); // Conversion complete
          resolve(blob);
        } else {
          reject(new Error("Failed to convert image"));
        }
      }, targetType);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

export const imageConverters = {
  convertImage,
};
