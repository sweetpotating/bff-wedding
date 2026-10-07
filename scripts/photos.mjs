#!/usr/bin/env node
// Prepare photos for the storybook: rotate upright, shrink to at most 1600 px on the long
// edge, save as JPEG, and strip all metadata (including GPS location).
//
//   npm run photos -- ~/Desktop/wedding-photos          every photo in a folder
//   npm run photos -- taiwan.jpg iceland.png            single files
//   npm run photos -- <folder> --max 1400 --quality 75  smaller files
//
// Output goes to site/images/ with a web-safe name (e.g. "IMG 1234.JPG" → img-1234.jpg).
// iPhone HEIC photos: export them as JPEG first (Photos app: File → Export), or AirDrop with
// Options → "Most Compatible".

import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = resolve(fileURLToPath(new URL('../site/', import.meta.url)));
const INPUT_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic', '.heif', '.avif']);

export function webName(file) {
  const stem = basename(file, extname(file))
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${stem || 'photo'}.jpg`;
}

function kb(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Prepare one photo. Returns details for the summary line. */
export async function preparePhoto(input, outDir, { max = 1600, quality = 80 } = {}) {
  const { default: sharp } = await import('sharp');
  const source = sharp(input, { failOn: 'error' });
  const meta = await source.metadata();
  const output = join(outDir, webName(input));
  const info = await source
    .rotate()
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(output);
  const before = (await stat(input)).size;
  return { input, output, before, after: info.size, from: [meta.width, meta.height], to: [info.width, info.height] };
}

async function collect(paths) {
  const files = [];
  for (const path of paths) {
    const info = await stat(path).catch(() => null);
    if (!info) {
      console.error(`✖ ${path} doesn't exist.`);
      continue;
    }
    if (info.isDirectory()) {
      for (const name of (await readdir(path)).sort()) {
        if (INPUT_TYPES.has(extname(name).toLowerCase())) files.push(join(path, name));
      }
    } else {
      files.push(path);
    }
  }
  return files;
}

function option(args, name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = Number(args[i + 1]);
  args.splice(i, 2);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const max = option(args, 'max', 1600);
  const quality = option(args, 'quality', 80);
  const outDir = join(SITE_DIR, 'images');
  if (!args.length) {
    console.log('Usage: npm run photos -- <folder or files> [--max 1600] [--quality 80]');
    process.exit(1);
  }
  try {
    await import('sharp');
  } catch {
    console.error('✖ The photo tool needs the "sharp" package. Run "npm install" first.');
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });
  const files = await collect(args);
  if (!files.length) {
    console.error('✖ No photos found (JPEG, PNG, WebP, TIFF, AVIF or HEIC).');
    process.exit(1);
  }
  let failed = 0;
  for (const file of files) {
    try {
      const r = await preparePhoto(file, outDir, { max, quality });
      console.log(
        `✔ ${basename(file)} → ${relative(SITE_DIR, r.output)}  ` +
          `${r.from[0]}×${r.from[1]}, ${kb(r.before)} → ${r.to[0]}×${r.to[1]}, ${kb(r.after)}`,
      );
    } catch (error) {
      failed += 1;
      const heic = /\.hei[cf]$/i.test(file);
      console.error(
        `✖ ${basename(file)}: ${heic ? 'HEIC photos need exporting as JPEG first (Photos app: File → Export).' : error.message}`,
      );
    }
  }
  console.log('\nNext: set each story\'s "photo": { "src": "images/<name>.jpg" } in site/content/storybook.json, then run npm run check.');
  console.log('Print the table photos from your originals, not from these web copies.');
  if (failed) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
