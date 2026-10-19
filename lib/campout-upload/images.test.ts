import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { imageToThumbnailDataUrl } from "./images";

function rawRgb(width: number, height: number): Buffer {
  return Buffer.alloc(width * height * 3, 128);
}

describe("imageToThumbnailDataUrl", () => {
  it("filters out an image smaller than the minimum dimension (REQ-30.12)", async () => {
    expect(await imageToThumbnailDataUrl({ width: 50, height: 50, data: rawRgb(50, 50) })).toBeNull();
    expect(await imageToThumbnailDataUrl({ width: 200, height: 50, data: rawRgb(200, 50) })).toBeNull();
  });

  it("returns a bounded JPEG data: URL for a large-enough raw image", async () => {
    const result = await imageToThumbnailDataUrl({ width: 200, height: 200, data: rawRgb(200, 200) });
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("filters an already-encoded image by its real decoded dimensions, not a caller-supplied guess", async () => {
    const tinyPng = await sharp(rawRgb(50, 50), { raw: { width: 50, height: 50, channels: 3 } }).png().toBuffer();
    expect(await imageToThumbnailDataUrl({ encoded: true, data: tinyPng })).toBeNull();

    const largePng = await sharp(rawRgb(200, 200), { raw: { width: 200, height: 200, channels: 3 } }).png().toBuffer();
    const result = await imageToThumbnailDataUrl({ encoded: true, data: largePng });
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("caps the output size well below a raw multi-megapixel source", async () => {
    const result = await imageToThumbnailDataUrl({ width: 2000, height: 2000, data: rawRgb(2000, 2000) });
    expect(result!.length).toBeLessThan(200_000);
  });
});
