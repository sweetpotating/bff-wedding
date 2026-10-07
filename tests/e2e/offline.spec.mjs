import { expect, test } from '@playwright/test';
import { createSiteServer } from '../../scripts/serve.mjs';
import { book, storyTags, titleOf } from './helpers.mjs';

test('after the first tap the book works with no connection (AC-12)', async ({ browser }) => {
  const server = createSiteServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  try {
    const [firstTag] = storyTags[0];
    const [laterTag, laterId] = storyTags.at(-1);
    await page.goto(`${base}?t=${firstTag}`);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-offline-ready'), null, { timeout: 15000 });
    expect(Number(await page.locator('html').getAttribute('data-offline-ready'))).toBe(book.stories.length);
    await page.goto(`${base}#contact-sheet`);
    await expect(page.locator('.saved')).toBeVisible();

    // Take the website away completely: no server, no network.
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));

    await page.goto(`${base}?t=${laterTag}`);
    await expect(page.locator('h1')).toHaveText(titleOf(laterId));
    const photoLoaded = await page
      .locator('img.main-photo')
      .evaluate((img) => (img.complete ? img.naturalWidth > 0 : new Promise((r) => img.addEventListener('load', () => r(true), { once: true }))));
    expect(photoLoaded).toBe(true);
    await expect(page.locator('.found-note')).toBeVisible();
  } finally {
    await context.close();
    if (server.listening) server.close();
  }
});
