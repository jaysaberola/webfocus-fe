export type PaynamicsProofScan = {
  valid: boolean;
  code: string;
  message: string;
  has_brand?: boolean;
  has_amount?: boolean;
  has_success?: boolean;
  has_date?: boolean;
  matched_request_id?: string | null;
};

export function isPdfReceipt(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function ocrReceiptFile(file: File): Promise<string> {
  if (isPdfReceipt(file)) {
    return "";
  }

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const imageUrl = URL.createObjectURL(file);

  try {
    const { data } = await worker.recognize(imageUrl);
    return (data.text || "").trim();
  } finally {
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
  }
}
