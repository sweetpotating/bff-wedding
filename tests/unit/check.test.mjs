import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CONTENT_FILE, checkBook, ndefBytes, parseContent, tagLink } from '../../scripts/check.mjs';

const starter = JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));
const copy = () => structuredClone(starter);
const has = (list, pattern) => list.some((message) => pattern.test(message));

test('the starter content has no errors (AC-13)', () => {
  const { errors } = checkBook(copy());
  assert.deepEqual(errors, []);
});

test('draft text is a warning normally and an error in strict mode (AC-13)', () => {
  const book = copy();
  book.welcome = ['✎ Say hello'];
  assert.ok(has(checkBook(book).warnings, /draft text/));
  assert.ok(has(checkBook(book, { strict: true }).errors, /draft text/));
});

test('content without draft text passes strict mode', () => {
  const finished = JSON.parse(JSON.stringify(copy()).replace(/"✎\s*/g, '"Written: '));
  assert.deepEqual(checkBook(finished, { strict: true }).errors, []);
});

test('a tag pointing to a missing story fails (AC-13)', () => {
  const book = copy();
  book.tags['9'] = 'honeymoon';
  assert.ok(has(checkBook(book).errors, /Tag "9" points to "honeymoon"/));
});

test('a duplicate story id fails (AC-13)', () => {
  const book = copy();
  book.stories[1].id = book.stories[0].id;
  assert.ok(has(checkBook(book).errors, /already used by story 1/));
});

test('a missing photo file fails (AC-13)', () => {
  const book = copy();
  book.stories[0].photo.src = 'images/not-there.jpg';
  assert.ok(has(checkBook(book).errors, /site\/images\/not-there\.jpg" doesn't exist/));
});

test('missing alt text fails (AC-13)', () => {
  const book = copy();
  book.stories[2].photo.alt = '';
  assert.ok(has(checkBook(book).errors, /photo\.alt is missing/));
});

test('a reserved story id fails (AC-13)', () => {
  const book = copy();
  book.stories[0].id = 'contact-sheet';
  assert.ok(has(checkBook(book).errors, /reserved/));
});

test('photos from other websites and paths outside the site fail', () => {
  const book = copy();
  book.stories[0].photo.src = 'https://example.com/a.jpg';
  book.stories[1].photo.src = '../package.json';
  const { errors } = checkBook(book);
  assert.ok(has(errors, /doesn't load files from other websites/));
  assert.ok(has(errors, /points outside the site folder/));
});

test('siteUrl must be https and end with a slash', () => {
  const book = copy();
  book.siteUrl = 'http://sweetpotating.github.io/bff-wedding';
  assert.ok(has(checkBook(book).errors, /siteUrl must be/));
});

test('a tag number that differs from its frame number warns', () => {
  const book = copy();
  [book.stories[3], book.stories[4]] = [book.stories[4], book.stories[3]];
  assert.ok(has(checkBook(book).warnings, /Tag 4 opens "taiwan", which is frame 5/));
});

test('a link too long for an NTAG213 fails', () => {
  const book = copy();
  book.siteUrl = `https://example.com/${'a'.repeat(120)}/`;
  assert.ok(has(checkBook(book).errors, /holds 144/));
});

test('404.html must agree with siteUrl', () => {
  const book = copy();
  book.siteUrl = 'https://example.github.io/another-repo/';
  assert.ok(has(checkBook(book).errors, /data-root/));
});

test('NDEF size of the real tag link is 48 bytes', () => {
  assert.equal(ndefBytes(tagLink('https://sweetpotating.github.io/bff-wedding/', '7')), 48);
  assert.equal(ndefBytes('https://www.a.co'), 2 + 4 + 5 + 1);
});

test('invalid JSON reports a line and column', () => {
  const { error } = parseContent('{\n  "a": 1,\n  "b": 2,\n}');
  assert.match(error, /line 4/);
});
