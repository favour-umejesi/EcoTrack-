import sharp from "sharp";

/**
 * Photo pipeline. Accepts JPEG, PNG or WebP (checked by magic bytes, not extension), applies the EXIF rotation,
 * resizes, re-encodes as WebP and drops every byte of metadata, including GPS. Returns a large image and a thumbnail.
 */
export type Processed = { large: Buffer; thumb: Buffer; width: number; height: number };

export function sniffImage(buf: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "webp";
  return null;
}

export async function processPhoto(input: Buffer): Promise<Processed> {
  const base = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const large = await base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  return { large: large.data, thumb, width: large.info.width, height: large.info.height };
}
