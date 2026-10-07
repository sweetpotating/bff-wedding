import { expect, test } from '@playwright/test';
import { expectStory, storyIds, storyTags, withContent } from './helpers.mjs';

// These tests swap in modified content, which a service worker would serve from its own copy.
test.use({ serviceWorkers: 'block' });

test('a phone that has not tapped sees the closed cover everywhere (AC-04)', async ({ page }) => {
  await withContent(page, (b) => ({ ...b, gate: 'tap' }));
  for (const address of ['/', `/#${storyIds[4] ?? storyIds[0]}`, '/#contact-sheet', '/#thank-you']) {
    await page.goto(address);
    await expect(page.locator('main')).toHaveAttribute('data-view', 'closed');
    await expect(page.locator('.closed-msg')).toBeVisible();
    await expect(page.locator('.prose')).toHaveCount(0);
    await expect(page.locator('.bar a[href="#contact-sheet"]')).toHaveCount(0);
  }
});

test('after one tap every story opens directly (AC-05)', async ({ page }) => {
  await withContent(page, (b) => ({ ...b, gate: 'tap' }));
  await page.goto(`/?t=${storyTags[0][0]}`);
  const other = storyIds.at(-1);
  await page.goto(`/#${other}`);
  await expectStory(page, other);
});

test('open mode needs no tap (AC-06)', async ({ page }) => {
  await withContent(page, (b) => ({ ...b, gate: 'open' }));
  const id = storyIds[4] ?? storyIds[0];
  await page.goto(`/#${id}`);
  await expectStory(page, id);
});

test('blocked storage still opens the book for the visit', async ({ page }) => {
  await page.addInitScript(() => {
    const fail = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    Object.defineProperty(window, 'localStorage', { get: fail });
  });
  await withContent(page, (b) => ({ ...b, gate: 'tap' }));
  await page.goto(`/?t=${storyTags[0][0]}`);
  await expectStory(page, storyTags[0][1]);
  await page.locator('.pager .next').click();
  await expect(page.locator('main')).toHaveAttribute('data-view', 'story');
});
