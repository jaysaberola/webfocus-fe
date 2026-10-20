/** Rasterize an SVG URL to PNG bytes (browser only). */
export async function svgUrlToPngArrayBuffer(svgUrl: string, widthPx: number): Promise<ArrayBuffer> {
  const response = await fetch(svgUrl);
  if (!response.ok) throw new Error("Logo could not be loaded.");
  const svgText = await response.text();
  const objectUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Logo could not be rendered."));
      img.src = objectUrl;
    });

    const heightPx = Math.max(1, Math.round(widthPx * (image.naturalHeight / image.naturalWidth || 56 / 240)));
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");
    ctx.drawImage(image, 0, 0, widthPx, heightPx);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))), "image/png");
    });
    return pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function svgUrlToPngDataUrl(svgUrl: string, widthPx: number): Promise<string> {
  const buffer = await svgUrlToPngArrayBuffer(svgUrl, widthPx);
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}
