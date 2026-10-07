import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import sharp from 'sharp';
import { book, sheetTag, storyTags } from './helpers.mjs';

test.use({ deviceScaleFactor: 4, viewport: { width: 1000, height: 1400 }, isMobile: false });

async function decode(locator) {
  const png = await locator.screenshot();
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

test('every QR code in the print kit decodes to its tag link (AC-15)', async ({ page }) => {
  await page.goto('/print/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', '');
  const rows = page.locator('table.tags tbody tr');
  await expect(rows).toHaveCount(Object.keys(book.tags).length);
  for (const tag of Object.keys(book.tags)) {
    const qr = page.locator(`tr[data-tag="${tag}"] svg.qr`);
    expect(await decode(qr)).toBe(`${book.siteUrl}?t=${tag}`);
  }
  expect(await decode(page.locator('.card svg.qr'))).toBe(`${book.siteUrl}?t=${sheetTag}`);
});

test('the print kit has two tap marks per frame and fits the tags', async ({ page }) => {
  await page.goto('/print/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', '');
  const claimTags = Object.values(book.tags).filter((t) => t === 'claim').length;
  const claimMarks = book.mission?.enabled ? claimTags * 2 : 0;
  await expect(page.locator('.marks svg.mark')).toHaveCount(storyTags.length * 2 + claimMarks);
  await expect(page.locator('.c-link .warn')).toHaveCount(0);
  const first = page.locator(`tr[data-tag="${storyTags[0][0]}"] .c-link a`);
  await expect(first).toHaveAttribute('href', `../?t=${storyTags[0][0]}`);
});

test('the print kit prints as three A4 pages', async ({ page }) => {
  await page.goto('/print/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', '');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
  expect(pages.length).toBe(3);
});
