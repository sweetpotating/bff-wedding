import { expect, test } from '@playwright/test';
import { book, storyTags, taggedStories, withContent } from './helpers.mjs';

// Each test sets the mission on or off itself, so they keep testing the feature even if the
// couple switches it off in the content file.
test.use({ serviceWorkers: 'block' });

const claimTag = Object.entries(book.tags).find(([, target]) => target === 'claim')?.[0];
const wordOf = (id) => book.stories.find((s) => s.id === id).word;
const message = book.stories
  .filter((s) => taggedStories.includes(s.id))
  .map((s) => s.word)
  .join(' ');
const total = taggedStories.length;

function missionOn(b) {
  b.mission = { ...b.mission, enabled: true };
  return b;
}

test.beforeEach(async ({ page }) => {
  await withContent(page, missionOn);
});

test('a tap checks in and reveals that photo’s word', async ({ page }) => {
  const [tag, id] = storyTags[3] ?? storyTags[0];
  await page.goto(`/?t=${tag}`);
  await expect(page.locator('.check-in .stamp')).toHaveText('Checked in');
  await expect(page.locator('.check-in-word span')).toHaveText(wordOf(id));
  await expect(page.locator('.word-card.is-found .word')).toHaveText(wordOf(id));
  await expect(page.locator('.bar-btn[href="#contact-sheet"]')).toContainText(`Mission 1/${total}`);
});

test('tapping the same photo twice counts once', async ({ page }) => {
  const [tag] = storyTags[0];
  await page.goto(`/?t=${tag}`);
  await page.goto(`/?t=${tag}`);
  await expect(page.locator('.check-in .stamp')).toHaveText('Already checked in');
  await expect(page.locator('.check-in-count')).toContainText(`1 of ${total} found`);
});

test('reading a story without tapping its photo keeps the word hidden', async ({ page }) => {
  await page.goto(`/?t=${storyTags[0][0]}`);
  const [, otherId] = storyTags[1];
  const frame = book.stories.findIndex((s) => s.id === otherId) + 1;
  await page.goto(`/#${otherId}`);
  await expect(page.locator('.check-in')).toHaveCount(0);
  await expect(page.locator('.word-card')).not.toHaveClass(/is-found/);
  await expect(page.locator('.word-card')).toContainText(`Tap the round mark on photo ${frame}`);
});

test('the mission card shows the message with blanks for the missing words', async ({ page }) => {
  await page.goto(`/?t=${storyTags[0][0]}`);
  await page.goto('/#contact-sheet');
  await expect(page.locator('h1')).toHaveText(`Find all ${total} photos`);
  await expect(page.locator('.sentence .slot.is-found')).toHaveText([wordOf(storyTags[0][1])]);
  await expect(page.locator('.sentence .blank')).toHaveCount(total - 1);
  await expect(page.locator('.sheet .frame-word')).toHaveText([wordOf(storyTags[0][1])]);
  await expect(page.locator('.mission-done')).toHaveCount(0);
});

test('the closed cover and the open cover both mention the prize', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.closed-prize')).toContainText(`finding all ${total} photos`);
  await page.goto(`/?t=${storyTags[0][0]}`);
  await page.goto('/#cover');
  await expect(page.locator('.mission-teaser')).toContainText(`Your mission: 1 of ${total}`);
});

test('the claim card says "not yet" before every photo is found', async ({ page }) => {
  test.skip(!claimTag, 'no claim tag in the tag map');
  await page.goto(`/?t=${storyTags[0][0]}`);
  await page.goto(`/?t=${claimTag}`);
  await expect(page.locator('main')).toHaveAttribute('data-view', 'sheet');
  await expect(page.locator('.flash .stamp')).toHaveText('Not yet');
  const state = await page.evaluate(() => window.storybook.state());
  expect(state.mission.claimedAt).toBeNull();
});

test('finding every photo completes the message, and the prize can be claimed once', async ({ page }) => {
  test.skip(!claimTag, 'no claim tag in the tag map');
  for (const [tag] of storyTags) await page.goto(`/?t=${tag}`);
  await expect(page.locator('.check-in .btn')).toContainText('Mission complete');

  await page.goto('/#contact-sheet');
  await expect(page.locator('.mission-done .done-message')).toHaveText(message);
  await expect(page.locator('.sentence')).toHaveCount(0);
  const code = await page.locator('.code span').textContent();
  expect(code).toMatch(/^[A-Z]{2}-[A-Z2-9]{4}$/);
  await expect(page.locator('.claim-status')).toHaveText('Not claimed yet');

  await page.reload();
  await expect(page.locator('.code span')).toHaveText(code);

  await page.goto(`/?t=${claimTag}`);
  await expect(page.locator('.flash.is-ok .stamp')).toHaveText('Prize claimed');
  await expect(page.locator('.claim-status')).toHaveClass(/is-claimed/);

  await page.goto(`/?t=${claimTag}`);
  await expect(page.locator('.flash.is-warn .stamp')).toHaveText('Already claimed');
});

test('a new guest on the same phone starts over', async ({ page }) => {
  await page.goto(`/?t=${storyTags[0][0]}`);
  await page.evaluate(() => window.storybook.reset());
  await page.goto(`/?t=${storyTags[1][0]}`);
  const state = await page.evaluate(() => window.storybook.state());
  expect(state.mission.found).toBe(1);
});

test('switching the mission off hides it everywhere', async ({ page }) => {
  await page.unrouteAll();
  await withContent(page, (b) => {
    b.mission = { ...b.mission, enabled: false };
    return b;
  });
  await page.goto(`/?t=${storyTags[0][0]}`);
  await expect(page.locator('main')).toHaveAttribute('data-view', 'story');
  await expect(page.locator('.check-in')).toHaveCount(0);
  await expect(page.locator('.word-card')).toHaveCount(0);
  await expect(page.locator('.bar-btn[href="#contact-sheet"]')).toContainText('All frames');
  await page.goto('/#contact-sheet');
  await expect(page.locator('h1')).toHaveText(`All ${book.stories.length} frames`);
});
