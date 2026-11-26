/**
 * Pure TypeScript PDF 1.4 generator that embeds a rendered GS1 canvas (JPEG)
 * directly via DCTDecode, requiring zero external runtime dependencies.
 */

export function createPdfBlobFromCanvas(
  canvas: HTMLCanvasElement,
  pageSize: "label100x75" | "a4Grid4" = "label100x75"
): Blob {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const base64 = dataUrl.split(",")[1] || "";
  const binaryStr = atob(base64);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // PDF points (72 pt = 1 inch)
  // 100x75mm ~ 283.46 x 212.60 pt; scale up cleanly 2x -> 567 x 425 pt
  // A4 portrait = 595.28 x 841.89 pt
  const pageWidth = pageSize === "a4Grid4" ? 595.28 : 566.93;
  const pageHeight = pageSize === "a4Grid4" ? 841.89 : 425.20;

  let contentCommands = "";
  if (pageSize === "label100x75") {
    contentCommands = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  } else {
    // Place 4 GS1 labels in a 2x2 grid on A4 with clean margins
    const margin = 24;
    const gap = 16;
    const cellW = (pageWidth - margin * 2 - gap) / 2;
    const cellH = cellW * (canvas.height / canvas.width);
    const topY = pageHeight - margin - cellH - 48;
    const row2Y = topY - cellH - gap;

    const coords = [
      [margin, topY],
      [margin + cellW + gap, topY],
      [margin, row2Y],
      [margin + cellW + gap, row2Y],
    ];
    contentCommands = coords
      .map(([x, y]) => `q\n${cellW.toFixed(2)} 0 0 ${cellH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`)
      .join("");
  }

  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentCommands);

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushStr = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    cursor += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    cursor += bytes.length;
  };

  pushStr("%PDF-1.4\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1: Catalog
  offsets.push(cursor);
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2: Pages
  offsets.push(cursor);
  pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3: Page
  offsets.push(cursor);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2
    )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (JPEG)
  offsets.push(cursor);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr("\nendstream\nendobj\n");

  // 5: Content Stream
  offsets.push(cursor);
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr("endstream\nendobj\n");

  const xrefOffset = cursor;
  pushStr(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    pushStr(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const blobParts: BlobPart[] = chunks.map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy;
  });
  return new Blob(blobParts, { type: "application/pdf" });
}
