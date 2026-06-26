// Capture the first frame of a video file as a JPEG blob for use as a poster.
export async function capturePoster(file: File): Promise<{ blob: Blob; duration: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.1, (v.duration || 1) / 4);
    };
    v.onseeked = () => {
      const canvas = document.createElement("canvas");
      const w = v.videoWidth || 720;
      const h = v.videoHeight || 1280;
      const max = 720;
      const scale = Math.min(1, max / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return resolve(null);
          resolve({ blob, duration: Math.round(v.duration) || 0 });
        },
        "image/jpeg",
        0.82,
      );
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}
