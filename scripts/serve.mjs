#!/usr/bin/env node
// Local preview of site/ that behaves like GitHub Pages: folder index pages,
// "/print" → "/print/" redirects, and 404.html for anything missing.
//
//   npm start                      http://localhost:4173
//   npm start -- --port 8080
//   npm start -- --host 0.0.0.0    reachable from a phone on the same Wi-Fi
//                                  (offline saving needs https, so it is off there)

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../site/', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function option(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function fileAt(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const full = normalize(join(ROOT, decoded));
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  try {
    const info = await stat(full);
    if (info.isDirectory()) return { dir: true, path: full };
    return { dir: false, path: full };
  } catch {
    return null;
  }
}

async function send(res, path, status = 200) {
  const body = await readFile(path);
  res.writeHead(status, {
    'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}

export function createSiteServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const found = await fileAt(url.pathname);
      if (found && found.dir) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
          return res.end();
        }
        const index = join(found.path, 'index.html');
        const hasIndex = await stat(index).then(() => true, () => false);
        if (hasIndex) return await send(res, index);
      } else if (found) {
        return await send(res, found.path);
      }
      return await send(res, join(ROOT, '404.html'), 404);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(error));
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(option('port', process.env.PORT || 4173));
  const host = option('host', '127.0.0.1');
  createSiteServer().listen(port, host, () => {
    const shown = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`Storybook preview: http://${shown}:${port}/`);
    console.log(`Open a tag as if tapped: http://${shown}:${port}/?t=1`);
  });
}
