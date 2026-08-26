// Convert public/images/divisi/*.png → .webp (alpha preserved, quality 90).
// Usage: node scripts/convert-divisi-webp.mjs
import { readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'public', 'images', 'divisi');
await mkdir(dir, { recursive: true });

for (const f of await readdir(dir)) {
  if (!f.toLowerCase().endsWith('.png')) continue;
  const src = path.join(dir, f);
  const out = src.replace(/\.png$/i, '.webp');
  const [s, o] = await Promise.all([
    stat(src),
    stat(out).catch(() => null),
  ]);
  if (o && o.mtimeMs >= s.mtimeMs) continue; // up to date
  await sharp(src).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
  console.log(`${f} → ${path.basename(out)}`);
}
console.log('Done.');
