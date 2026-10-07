#!/usr/bin/env node
// Pre-launch check for site/content/storybook.json.
//
//   npm run check           errors fail; draft text (✎) is a warning
//   npm run check:strict    draft text fails too. Run before writing tags and before the wedding.

import { readFileSync, statSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_DIR = resolve(fileURLToPath(new URL('../site/', import.meta.url)));
export const CONTENT_FILE = join(SITE_DIR, 'content', 'storybook.json');
export const RESERVED = ['cover', 'contact-sheet', 'thank-you'];
export const NTAG213_BYTES = 144;
const DRAFT = '✎';
const PHOTO_WARN_BYTES = 400 * 1024;
const ALL_PHOTOS_WARN_BYTES = 3 * 1024 * 1024;
const URI_PREFIXES = ['', 'http://www.', 'https://www.', 'http://', 'https://'];

/** Bytes an NDEF message holding one URI record takes on a tag, including the TLV wrapper. */
export function ndefBytes(url) {
  let code = 0;
  URI_PREFIXES.forEach((prefix, i) => {
    if (i > 0 && url.startsWith(prefix) && prefix.length > URI_PREFIXES[code].length) code = i;
  });
  const payload = 1 + Buffer.byteLength(url.slice(URI_PREFIXES[code].length), 'utf8');
  const record = 3 + (payload < 256 ? 1 : 4) + payload;
  return (record < 255 ? 2 : 4) + record + 1;
}

export function tagLink(siteUrl, tagId) {
  return `${siteUrl}?t=${encodeURIComponent(tagId)}`;
}

/** Parse JSON, turning syntax errors into a message with a line and column. */
export function parseContent(text) {
  try {
    return { book: JSON.parse(text) };
  } catch (error) {
    const match = /position (\d+)/.exec(error.message);
    let where = '';
    if (match) {
      const before = text.slice(0, Number(match[1]));
      const line = before.split('\n').length;
      const column = before.length - before.lastIndexOf('\n');
      where = ` (line ${line}, column ${column})`;
    } else {
      const lineCol = /line (\d+) column (\d+)/.exec(error.message);
      if (lineCol) where = ` (line ${lineCol[1]}, column ${lineCol[2]})`;
    }
    return {
      error: `storybook.json is not valid JSON${where}: ${error.message}. Look for a missing comma or quote, or a comma after the last item in a list.`,
    };
  }
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDraft(value) {
  return typeof value === 'string' && value.trim().startsWith(DRAFT);
}

function draftPaths(node, path, out) {
  if (typeof node === 'string') {
    if (isDraft(node)) out.push(path);
  } else if (Array.isArray(node)) {
    node.forEach((item, i) => draftPaths(item, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => draftPaths(value, path ? `${path}.${key}` : key, out));
  }
  return out;
}

/**
 * Check a parsed storybook. Returns { errors, warnings, notes }.
 * siteDir is the folder that photo paths are relative to.
 */
export function checkBook(book, { siteDir = SITE_DIR, strict = false } = {}) {
  const errors = [];
  const warnings = [];
  const notes = [];

  if (!book || typeof book !== 'object' || Array.isArray(book)) {
    errors.push('The file must contain one JSON object ({ … }).');
    return { errors, warnings, notes };
  }

  // Book settings
  const siteUrl = book.siteUrl;
  if (!isText(siteUrl) || !/^https:\/\/[^/\s]+\/(?:[^\s?#]*\/)?$/.test(siteUrl)) {
    errors.push('siteUrl must be the full https:// address of the site, ending in "/", e.g. "https://sweetpotating.github.io/bff-wedding/".');
  }
  if (!Array.isArray(book.names) || book.names.length !== 2 || !book.names.every(isText)) {
    errors.push('names must be a list of the two names, e.g. ["Huixin", "Yongquan"].');
  }
  for (const key of ['welcome', 'closing']) {
    if (!Array.isArray(book[key]) || !book[key].length || !book[key].every(isText)) {
      errors.push(`${key} must be a list of one or more paragraphs (text in quotes).`);
    }
  }
  if (book.gate !== 'tap' && book.gate !== 'open') {
    errors.push('gate must be "tap" (the book opens after a tag tap) or "open" (anyone with the link).');
  }
  for (const key of ['eyebrow', 'date', 'venue', 'accent']) {
    if (book[key] !== undefined && typeof book[key] !== 'string') errors.push(`${key} must be text in quotes.`);
  }
  if (isText(book.accent) && !/^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab)\(.+\)|[a-z]+)$/i.test(book.accent.trim())) {
    warnings.push(`accent "${book.accent}" doesn't look like a CSS colour (e.g. "#8a5a44"); the default red will be used if browsers reject it.`);
  }
  const links = book.links ?? {};
  if (typeof links !== 'object' || Array.isArray(links)) {
    errors.push('links must be an object: { "wishes": "", "album": "" }.');
  } else {
    for (const key of ['wishes', 'album']) {
      const value = links[key];
      if (value !== undefined && value !== '' && !(isText(value) && /^https:\/\//.test(value))) {
        errors.push(`links.${key} must be empty or a full https:// link.`);
      }
    }
  }

  // Stories
  const stories = Array.isArray(book.stories) ? book.stories : [];
  if (!stories.length) errors.push('stories must be a list with at least one story.');
  const ids = new Map();
  let photoBytes = 0;

  const checkFile = (src, label, kind) => {
    if (!isText(src)) {
      errors.push(`${label}: ${kind} is missing.`);
      return null;
    }
    if (/^[a-z]+:/i.test(src) || src.startsWith('/') || src.startsWith('//')) {
      errors.push(`${label}: "${src}" must be a file inside site/ (like "images/taiwan.jpg"). The site doesn't load files from other websites.`);
      return null;
    }
    const full = normalize(join(siteDir, src));
    if (!full.startsWith(siteDir + sep)) {
      errors.push(`${label}: "${src}" points outside the site folder.`);
      return null;
    }
    try {
      const info = statSync(full);
      if (!info.isFile()) throw new Error('not a file');
      return info.size;
    } catch {
      errors.push(`${label}: file "site/${src}" doesn't exist. Check the spelling and the folder (file names are case-sensitive).`);
      return null;
    }
  };

  stories.forEach((story, index) => {
    const label = `Story ${index + 1}${story && isText(story.id) ? ` ("${story.id}")` : ''}`;
    if (!story || typeof story !== 'object') {
      errors.push(`${label} must be an object ({ … }).`);
      return;
    }
    if (!isText(story.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.id)) {
      errors.push(`${label}: id must use lowercase letters, digits and single hyphens, e.g. "new-zealand".`);
    } else if (RESERVED.includes(story.id)) {
      errors.push(`${label}: id "${story.id}" is reserved for a built-in page. Pick another id.`);
    } else if (ids.has(story.id)) {
      errors.push(`${label}: id "${story.id}" is already used by story ${ids.get(story.id) + 1}. Each id must be unique.`);
    } else {
      ids.set(story.id, index);
    }
    if (!isText(story.title)) errors.push(`${label}: title is missing.`);
    for (const key of ['kicker', 'caption']) {
      if (story[key] !== undefined && typeof story[key] !== 'string') errors.push(`${label}: ${key} must be text in quotes.`);
    }

    const photo = story.photo;
    if (!photo || typeof photo !== 'object') {
      errors.push(`${label}: photo is missing. Add "photo": { "src": "images/…", "alt": "…" }.`);
    } else {
      const size = checkFile(photo.src, label, 'photo.src');
      if (size !== null) {
        photoBytes += size;
        if (size > PHOTO_WARN_BYTES) {
          warnings.push(`${label}: photo is ${Math.round(size / 1024)} KB. Run "npm run photos -- <folder>" to shrink it below 400 KB.`);
        }
      }
      if (!isText(photo.alt)) errors.push(`${label}: photo.alt is missing. Describe the photo in one sentence for screen readers.`);
      if (photo.position !== undefined && !/^[\d.]+%\s+[\d.]+%$|^(center|top|bottom|left|right)(\s+(center|top|bottom|left|right))?$/.test(String(photo.position).trim())) {
        warnings.push(`${label}: photo.position "${photo.position}" should look like "50% 30%".`);
      }
    }

    if (!Array.isArray(story.body) || !story.body.length || !story.body.every(isText)) {
      errors.push(`${label}: body must be a list of one or more paragraphs.`);
    } else {
      const words = story.body.join(' ').split(/\s+/).filter(Boolean).length;
      if (!story.body.some(isDraft) && words > 260) {
        notes.push(`${label}: ${words} words. Around 80–200 words reads in about a minute at the table.`);
      }
    }

    if (story.voices !== undefined) {
      if (!Array.isArray(story.voices) || !story.voices.every((v) => v && isText(v.name) && isText(v.text))) {
        errors.push(`${label}: voices must be a list of { "name": "…", "text": "…" }.`);
      }
    }
    if (story.gallery !== undefined) {
      if (!Array.isArray(story.gallery)) {
        errors.push(`${label}: gallery must be a list of photos.`);
      } else {
        if (story.gallery.length > 6) warnings.push(`${label}: gallery has ${story.gallery.length} photos; only the first 6 are shown.`);
        story.gallery.forEach((g, gi) => {
          const glabel = `${label} gallery photo ${gi + 1}`;
          if (!g || typeof g !== 'object') {
            errors.push(`${glabel} must be { "src": "…", "alt": "…" }.`);
            return;
          }
          const size = checkFile(g.src, glabel, 'src');
          if (size !== null && size > PHOTO_WARN_BYTES) {
            warnings.push(`${glabel}: ${Math.round(size / 1024)} KB. Run "npm run photos" to shrink it.`);
          }
          if (!isText(g.alt)) errors.push(`${glabel}: alt is missing.`);
        });
      }
    }
    if (story.audio !== undefined) {
      if (!story.audio || typeof story.audio !== 'object') errors.push(`${label}: audio must be { "src": "audio/…", "label": "…" }.`);
      else checkFile(story.audio.src, label, 'audio.src');
    }
    if (story.video !== undefined) {
      if (!story.video || !isText(story.video.url) || !/^https:\/\//.test(story.video.url)) {
        errors.push(`${label}: video.url must be a full https:// link.`);
      }
    }
  });

  if (photoBytes > ALL_PHOTOS_WARN_BYTES) {
    warnings.push(`Main photos add up to ${(photoBytes / 1024 / 1024).toFixed(1)} MB. Keep them under 3 MB so phones can save the whole book on a weak signal.`);
  }

  // Tag map
  const tags = book.tags;
  if (!tags || typeof tags !== 'object' || Array.isArray(tags) || !Object.keys(tags).length) {
    errors.push('tags must map tag numbers to stories, e.g. { "1": "how-we-met" }.');
  } else {
    const tagged = new Set();
    for (const [tagId, target] of Object.entries(tags)) {
      if (!/^[a-z0-9-]{1,16}$/.test(tagId)) {
        errors.push(`Tag "${tagId}": tag ids may only use lowercase letters, digits and hyphens (1–16 characters).`);
        continue;
      }
      if (!isText(target) || (!ids.has(target) && !RESERVED.includes(target))) {
        errors.push(`Tag "${tagId}" points to "${target}", which is not a story id. Story ids: ${[...ids.keys()].join(', ') || 'none'}.`);
        continue;
      }
      if (ids.has(target)) {
        tagged.add(target);
        const frame = ids.get(target) + 1;
        if (/^\d+$/.test(tagId) && Number(tagId) !== frame) {
          warnings.push(`Tag ${tagId} opens "${target}", which is frame ${frame}. Its tap mark on the table will say ${tagId} but the story says "Frame ${frame}". Reorder the stories or renumber the tags.`);
        }
      }
      if (isText(siteUrl)) {
        const bytes = ndefBytes(tagLink(siteUrl, tagId));
        if (bytes > NTAG213_BYTES) {
          errors.push(`Tag "${tagId}": its link needs ${bytes} bytes but an NTAG213 holds ${NTAG213_BYTES}. Shorten siteUrl or use NTAG215 stickers.`);
        }
      }
    }
    if (!Object.values(tags).includes('contact-sheet')) {
      warnings.push('No tag points to "contact-sheet". The table card QR code needs one (usually tag "0").');
    }
    for (const id of ids.keys()) {
      if (!tagged.has(id)) notes.push(`Story "${id}" has no tag, so it isn't on the table (fine for a chapter added after the wedding).`);
    }
  }

  // Draft text
  const drafts = draftPaths(book, '', []).map((path) =>
    path.replace(/^stories\[(\d+)\]\.?/, (match, i) => (isText(stories[i]?.id) ? `${stories[i].id} › ` : match)),
  );
  if (drafts.length) {
    const list = drafts.slice(0, 12).join(', ') + (drafts.length > 12 ? `, and ${drafts.length - 12} more` : '');
    const message = `${drafts.length} piece${drafts.length === 1 ? '' : 's'} of draft text (starting with ${DRAFT}) still to write: ${list}.`;
    if (strict) errors.push(message);
    else warnings.push(message);
  }

  // Files that repeat the address
  if (isText(siteUrl)) {
    try {
      const notFound = readFileSync(join(siteDir, '404.html'), 'utf8');
      const root = /data-root="([^"]*)"/.exec(notFound)?.[1];
      const path = new URL(siteUrl).pathname;
      if (root !== undefined && root !== path) {
        errors.push(`site/404.html has data-root="${root}" but siteUrl's path is "${path}". Make them match, or mistyped links won't find the storybook.`);
      }
    } catch {
      // No 404 page (e.g. tests with a minimal site folder).
    }
    try {
      const index = readFileSync(join(siteDir, 'index.html'), 'utf8');
      const image = /property="og:image" content="([^"]+)"/.exec(index)?.[1];
      if (image && !image.startsWith(siteUrl)) {
        warnings.push(`site/index.html's og:image (${image}) doesn't start with siteUrl, so link previews in chat apps won't show the picture.`);
      }
    } catch {
      // No index page in this folder.
    }
  }

  return { errors, warnings, notes };
}

function main() {
  const strict = process.argv.includes('--strict');
  let text;
  try {
    text = readFileSync(CONTENT_FILE, 'utf8');
  } catch (error) {
    console.error(`✖ Can't read ${CONTENT_FILE}: ${error.message}`);
    process.exit(1);
  }
  const parsed = parseContent(text);
  if (parsed.error) {
    console.error(`✖ ${parsed.error}`);
    process.exit(1);
  }
  const { errors, warnings, notes } = checkBook(parsed.book, { strict });
  const book = parsed.book;
  console.log(`Checking site/content/storybook.json${strict ? ' (strict)' : ''}`);
  if (Array.isArray(book.stories)) console.log(`  ${book.stories.length} stories, ${Object.keys(book.tags || {}).length} tags, gate "${book.gate}"`);
  if (typeof book.siteUrl === 'string' && book.tags && typeof book.tags === 'object') {
    const first = Object.keys(book.tags)[0];
    if (first !== undefined) {
      const link = tagLink(book.siteUrl, first);
      console.log(`  Tag links look like ${link} (${ndefBytes(link)} of ${NTAG213_BYTES} bytes on an NTAG213)`);
    }
  }
  notes.forEach((m) => console.log(`  · ${m}`));
  warnings.forEach((m) => console.log(`⚠ ${m}`));
  errors.forEach((m) => console.log(`✖ ${m}`));
  if (errors.length) {
    console.log(`\n${errors.length} error${errors.length === 1 ? '' : 's'}. Fix ${errors.length === 1 ? 'it' : 'them'} before publishing.`);
    process.exit(1);
  }
  console.log(`\n✔ No errors${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

