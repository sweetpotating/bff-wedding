import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import { preparePhoto, webName } from '../../scripts/photos.mjs';

test('web names are lowercase and hyphenated', () => {
  assert.equal(webName('/x/IMG 1234.JPG'), 'img-1234.jpg');
  assert.equal(webName('Café du Monde (2).png'), 'cafe-du-monde-2.jpg');
});

test('photos are turned upright, shrunk and stripped of metadata (FR-27)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'storybook-photos-'));
  try {
    const input = join(dir, 'Sideways Phone Photo.jpg');
    await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#88aacc' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Copyright: 'Huixin and Yongquan', Make: 'TestPhone' } })
      .toFile(input);
    const before = await sharp(input).metadata();
    assert.equal(before.orientation, 6);
    assert.ok(before.exif, 'the test photo starts with EXIF data');

    const result = await preparePhoto(input, dir);
    assert.equal(result.output, join(dir, 'sideways-phone-photo.jpg'));
    const after = await sharp(result.output).metadata();
    assert.equal(after.format, 'jpeg');
    assert.deepEqual([after.width, after.height], [1067, 1600]);
    assert.equal(after.exif, undefined);
    assert.equal(after.orientation, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
