import { expect, test } from '@playwright/test';
import { storyIds, storyTags } from './helpers.mjs';

const screens = [
  ['closed cover', '/', false],
  ['cover', '/#cover', true],
  ['story', `/#${storyIds[3] ?? storyIds[0]}`, true],
  ['contact sheet', '/#contact-sheet', true],
  ['thank-you page', '/#thank-you', true],
];

for (const width of [320, 390]) {
  for (const [name, address, opened] of screens) {
    test(`${name} fits a ${width}px screen with no errors`, async ({ page }) => {
      const problems = [];
      page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
      page.on('pageerror', (e) => problems.push(e.message));
      await page.setViewportSize({ width, height: 800 });
      if (opened) await page.goto(`/?t=${storyTags[0][0]}`);
      await page.goto(address);
      await page.reload();
      await expect(page.locator('main')).not.toHaveAttribute('data-view', '');
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        const limit = window.innerWidth + 1;
        return [...document.querySelectorAll('body *')]
          .filter((el) => !el.closest('.strip, .sr-only'))
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.right > limit || r.left < -1))
          .map(({ el, r }) => `${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.left)}–${Math.round(r.right)}`);
      });
      expect(overflow).toEqual([]);
      await expect(page.locator('h1')).toHaveCount(1);
      const missingAlt = await page.locator('main img:not([alt])').count();
      expect(missingAlt).toBe(0);
      expect(problems).toEqual([]);
    });
  }
}

test('the page language is set and the content security policy is in place', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /script-src 'self'/);
});

test('reduced motion skips the photo animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`/?t=${storyTags[0][0]}`);
  await expect(page.locator('img.main-photo')).not.toHaveClass(/develop/);
  await context.close();
});
