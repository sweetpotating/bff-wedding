import { expect, test } from '@playwright/test';
import { book, expectStory, sheetTag, storyTags } from './helpers.mjs';

test('a tag opens its story, cleans the address and marks it found (AC-01)', async ({ page }) => {
  const [tag, id] = storyTags.at(-2) ?? storyTags[0];
  await page.goto(`/?t=${tag}`);
  await expectStory(page, id);
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  expect(page.url()).not.toContain('?t=');
  await expect(page.locator('.found-note')).toBeVisible();

  await page.goto('/#contact-sheet');
  await expect(page.locator('.sheet li.found')).toHaveCount(1);
  await expect(page.locator(`.sheet li.found a[href="#${id}"]`)).toHaveCount(1);
});

test('every tag in the tag map opens its target (AC-02)', async ({ browser }) => {
  for (const [tag, target] of Object.entries(book.tags)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/?t=${tag}`);
    if (target === 'contact-sheet') {
      await expect(page.locator('main')).toHaveAttribute('data-view', 'sheet');
    } else if (target === 'cover') {
      await expect(page.locator('main')).toHaveAttribute('data-view', 'cover');
    } else {
      await expectStory(page, target);
    }
    await context.close();
  }
});

test('the table card QR opens the book without marking anything found', async ({ page }) => {
  test.skip(!sheetTag, 'no tag points to the contact sheet');
  await page.goto(`/?t=${sheetTag}`);
  await expect(page.locator('main')).toHaveAttribute('data-view', 'sheet');
  await expect(page.locator('.sheet li.found')).toHaveCount(0);
  await expect(page.locator('.progress strong')).toHaveText(`0 of ${new Set(storyTags.map(([, id]) => id)).size}`);
});

test('an unknown tag opens the contact sheet and the book (AC-03)', async ({ page }) => {
  await page.goto('/?t=nope');
  await expect(page.locator('main')).toHaveAttribute('data-view', 'sheet');
  await expect(page.locator('.sheet li.found')).toHaveCount(0);
  await page.goto('/#cover');
  await expect(page.locator('main')).toHaveAttribute('data-view', 'cover');
});

test('a mistyped address still finds its story (AC-16)', async ({ page }) => {
  const [tag, id] = storyTags[2] ?? storyTags[0];
  await page.goto(`/oops/not-here?t=${tag}`);
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  await expectStory(page, id);
});
