import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';

export const book = JSON.parse(readFileSync(new URL('../../site/content/storybook.json', import.meta.url), 'utf8'));

export const plain = (text) => String(text ?? '').trim().replace(/^✎\s*/, '');
export const storyIds = book.stories.map((s) => s.id);
export const titleOf = (id) => plain(book.stories.find((s) => s.id === id).title);

/** [tagId, storyId] for every tag that opens a story, in tag order. */
export const storyTags = Object.entries(book.tags)
  .filter(([, target]) => storyIds.includes(target))
  .sort(([a], [b]) => Number(a) - Number(b));
export const taggedStories = [...new Set(storyTags.map(([, id]) => id))];
export const sheetTag = Object.entries(book.tags).find(([, target]) => target === 'contact-sheet')?.[0];

export async function view(page) {
  return page.locator('main').getAttribute('data-view');
}

export async function expectStory(page, id) {
  await expect(page.locator('main')).toHaveAttribute('data-view', 'story');
  await expect(page.locator('h1')).toHaveText(titleOf(id));
}

/** Serve a modified copy of the content file. */
export async function withContent(page, change) {
  const modified = change(structuredClone(book)) ?? null;
  await page.route('**/content/storybook.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(modified) }),
  );
}
