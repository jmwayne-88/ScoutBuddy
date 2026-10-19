import { imageToThumbnailDataUrl } from "./images";
import type { ParsedSection } from "./types";

// REQ-30.3/30.5: `pdfjs-dist`'s legacy Node build gives both the text layer
// (page.getTextContent) and, via its own internal image decoding
// (page.getOperatorList + page.objs.get), each embedded image's raw pixel
// data -- without ever needing `canvas` to render a page. See ADR 0031 for
// why that matters (no native-build risk on Windows). Imported with a
// literal specifier (not a runtime-computed path via require.resolve) --
// Turbopack (this Next version's bundler) can't follow a dynamic import()
// built from a computed string ("Cannot find module as expression is too
// dynamic"), confirmed by running this under `next dev`.
async function loadPdfjs() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

export class NoExtractablePdfTextError extends Error {
  constructor() {
    super(
      "This PDF has no extractable text layer (it looks like a scanned or photographed document). " +
        "Only PDFs with real text -- typed flyers, or anything exported from Word/Excel/Google Docs -- are supported."
    );
  }
}

export async function parsePdf(bytes: Uint8Array, maxPages: number): Promise<ParsedSection[]> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    disableFontFace: true,
  }).promise;

  if (doc.numPages > maxPages) {
    throw new Error(`This PDF has ${doc.numPages} pages; uploads are limited to ${maxPages}.`);
  }

  const pages: ParsedSection[] = [];
  let hasAnyText = false;

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: unknown) => (typeof item === "object" && item !== null && "str" in item ? String(item.str) : ""))
      .join(" ")
      .trim();
    if (text !== "") hasAnyText = true;

    const images = await extractPageImages(page, pdfjs);
    pages.push({ sectionNumber: pageNumber, text, images });
  }

  if (!hasAnyText) {
    throw new NoExtractablePdfTextError();
  }

  return pages;
}

async function extractPageImages(
  page: {
    getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
    objs: { get: (name: string, callback: (data: unknown) => void) => void };
  },
  pdfjs: { OPS: Record<string, number>; ImageKind: Record<string, number> }
): Promise<string[]> {
  const opList = await page.getOperatorList();
  const images: string[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    if (opList.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue;
    const name = opList.argsArray[i][0];
    if (typeof name !== "string") continue;

    try {
      const resolved = await new Promise<unknown>((resolve) => page.objs.get(name, resolve));
      const imgData = resolved as {
        width: number;
        height: number;
        kind?: number;
        data?: Uint8ClampedArray | Uint8Array;
      } | null;

      if (!imgData?.data) continue;
      const channels: 1 | 3 | 4 =
        imgData.kind === pdfjs.ImageKind.RGBA_32BPP ? 4 : imgData.kind === pdfjs.ImageKind.GRAYSCALE_1BPP ? 1 : 3;

      const dataUrl = await imageToThumbnailDataUrl({
        width: imgData.width,
        height: imgData.height,
        data: Buffer.from(imgData.data),
        channels,
      });
      if (dataUrl) images.push(dataUrl);
    } catch {
      // REQ-30.11 is an enhancement, not the core value of this feature --
      // one undecodable embedded image never fails the whole upload.
      continue;
    }
  }

  return images;
}
