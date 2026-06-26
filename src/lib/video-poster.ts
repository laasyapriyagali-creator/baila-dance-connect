// Capture the first frame of a video file as a JPEG blob for use as a poster.
// Resolves null if the browser can't decode the file (e.g. mobile codec issue)
// so the upload flow keeps going without a poster.
export async function capturePoster(
  file: File,
  timeoutMs = 8000,
): Promise<{ blob: Blob | null; duration: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    let settled = false;
    const finish = (result: { blob: Blob | null; duration: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        URL.revokeObjectURL(url);
      } catch {
        // noop
      }
      resolve(result);
    };
    const timer = setTimeout(() => {
      // Couldn't extract metadata in time — proceed without poster but allow upload.
      finish({ blob: null, duration: 0 });
    }, timeoutMs);

    v.onloadedmetadata = () => {
      const dur = Number.isFinite(v.duration) ? v.duration : 0;
      try {
        v.currentTime = Math.min(0.1, (dur || 1) / 4);
      } catch {
        finish({ blob: null, duration: Math.round(dur) });
      }
    };
    v.onseeked = () => {
      const dur = Number.isFinite(v.duration) ? Math.round(v.duration) : 0;
      try {
        const canvas = document.createElement("canvas");
        const w = v.videoWidth || 720;
        const h = v.videoHeight || 1280;
        const max = 720;
        const scale = Math.min(1, max / Math.max(w, h));
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish({ blob: null, duration: dur });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => finish({ blob: blob ?? null, duration: dur }),
          "image/jpeg",
          0.82,
        );
      } catch {
        finish({ blob: null, duration: dur });
      }
    };
    v.onerror = () => {
      const dur = Number.isFinite(v.duration) ? Math.round(v.duration) : 0;
      finish({ blob: null, duration: dur });
    };
    v.src = url;
  });
}
