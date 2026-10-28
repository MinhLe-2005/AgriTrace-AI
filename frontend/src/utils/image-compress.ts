export type CompressionResult = {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  width: number;
  height: number;
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function compressAvatarImage(
  file: File,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // Only accept image files
    if (!file.type.startsWith("image/")) {
      reject(new Error("Tệp được chọn không phải là định dạng hình ảnh hợp lệ."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while fitting into maxWidth x maxHeight
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo bộ xử lý hình ảnh (Canvas)."));
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP, fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Calculate approximate size from base64 string
        const base64Content = dataUrl.split(",")[1] || "";
        const compressedSize = Math.round((base64Content.length * 3) / 4);
        const originalSize = file.size;
        const savedPercent = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        );

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          savedPercent,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error("Không thể tải và đọc file ảnh này."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Lỗi khi đọc file ảnh từ thiết bị."));
    reader.readAsDataURL(file);
  });
}
