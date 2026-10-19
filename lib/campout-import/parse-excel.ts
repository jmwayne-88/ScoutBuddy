import ExcelJS from "exceljs";
import { imageToThumbnailDataUrl } from "./images";
import type { ParsedSection } from "./types";

// REQ-30.7: one worksheet is one "section" (same role a PDF page plays in
// parse-pdf.ts), but a worksheet is never assumed to hold exactly one
// campout -- the Claude extraction step still segments its text freely.
// Cell contents are dumped row by row, not mapped to named columns, so an
// unlabeled list and a sheet with real headers are handled by the same
// inference step rather than a hardcoded column-name assumption.
export async function parseExcel(bytes: Uint8Array, maxSheets: number): Promise<ParsedSection[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type declarations conflict with this project's
  // @types/node version of the global `Buffer` type (a structurally
  // identical Buffer is still rejected), so the only clean way past the
  // mismatch is routing through `any` here.
  await workbook.xlsx.load(Buffer.from(bytes) as any);

  const worksheets = workbook.worksheets.slice(0, maxSheets);
  const sections: ParsedSection[] = [];

  for (let i = 0; i < worksheets.length; i++) {
    const worksheet = worksheets[i];
    const rows: string[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.text?.trim();
        if (value) cells.push(value);
      });
      if (cells.length > 0) rows.push(cells.join(" | "));
    });

    const images: string[] = [];
    for (const image of worksheet.getImages()) {
      const media = workbook.getImage(Number(image.imageId));
      if (!media?.buffer) continue;
      try {
        const dataUrl = await imageToThumbnailDataUrl({ encoded: true, data: Buffer.from(media.buffer) });
        if (dataUrl) images.push(dataUrl);
      } catch {
        continue;
      }
    }

    sections.push({ sectionNumber: i + 1, text: rows.join("\n"), images });
  }

  return sections;
}
