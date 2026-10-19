import sharp from "sharp";

// REQ-30.12: anything smaller than this on either dimension is treated as
// decorative (a logo, a bullet icon) and never offered as a thumbnail
// candidate.
const MIN_THUMBNAIL_DIMENSION = 100;

// REQ-30 Data Model Impact #3: no blob storage -- a thumbnail is resized/
// recompressed down to a bounded `data:` URL and stored directly in
// Campout.imageUrl, same as every other string field on that row. Capping
// the longest side and JPEG quality keeps each thumbnail in the tens-of-KB
// range rather than carrying a multi-MB source photo into Postgres.
const MAX_THUMBNAIL_DIMENSION = 800;
const JPEG_QUALITY = 75;

export type RawImage =
  | { encoded: true; data: Buffer | Uint8Array } // an already-encoded file (PNG/JPEG/etc), e.g. from exceljs -- real dimensions read via sharp
  | { encoded?: false; width: number; height: number; data: Buffer | Uint8Array; channels?: 1 | 3 | 4 }; // raw pixel data, e.g. from pdfjs-dist

export async function imageToThumbnailDataUrl(image: RawImage): Promise<string | null> {
  const pipeline = image.encoded
    ? sharp(Buffer.from(image.data))
    : sharp(Buffer.from(image.data), {
        raw: { width: image.width, height: image.height, channels: image.channels ?? 3 },
      });

  // REQ-30.12: filter by the image's real dimensions either way -- for raw
  // pixel input that's already known; for an encoded file it's read via
  // sharp's own metadata first, since the caller doesn't know it upfront.
  const { width = 0, height = 0 } = image.encoded ? await pipeline.metadata() : image;
  if (width < MIN_THUMBNAIL_DIMENSION || height < MIN_THUMBNAIL_DIMENSION) {
    return null;
  }

  const jpeg = await pipeline
    .resize(MAX_THUMBNAIL_DIMENSION, MAX_THUMBNAIL_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}
