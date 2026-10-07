import { expect, test } from '@playwright/test';
import { book, expectStory, plain, storyIds, storyTags, taggedStories, titleOf, withContent } from './helpers.mjs';

// These tests swap in modified content, which a service worker would serve from its own copy.
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.goto(`/?t=${storyTags[0][0]}`);
  await expect(page.locator('main')).toHaveAttribute('data-view', 'story');
});

test('next goes through every story in order, then the thank-you page (AC-07)', async ({ page }) => {
  await page.goto(`/#${storyIds[0]}`);
  const seen = [];
  for (let i = 0; i < storyIds.length; i++) {
    await expect(page.locator('main')).toHaveAttribute('data-view', 'story');
    await expect(page.locator('.frame-no')).toHaveText(`Frame ${i + 1} of ${storyIds.length}`);
    seen.push(await page.locator('h1').textContent());
    await page.locator('.pager .next').click();
  }
  expect(seen).toEqual(storyIds.map(titleOf));
  await expect(page.locator('main')).toHaveAttribute('data-view', 'end');
  await expect(page.locator('h1')).toHaveText('Thank you');
});

test('previous from the first story goes to the cover', async ({ page }) => {
  await page.goto(`/#${storyIds[0]}`);
  await page.locator('.pager .prev').click();
  await expect(page.locator('main')).toHaveAttribute('data-view', 'cover');
});

test('the contact sheet lists every story and opens each one (AC-08)', async ({ page }) => {
  await page.goto('/#contact-sheet');
  const links = page.locator('.sheet a');
  await expect(links).toHaveCount(storyIds.length);
  for (let i = 0; i < storyIds.length; i++) {
    await page.goto('/#contact-sheet');
    await page.locator('.sheet a').nth(i).click();
    await expectStory(page, storyIds[i]);
  }
});

test('the contact sheet is one tap away from every screen', async ({ page }) => {
  for (const address of ['/#cover', `/#${storyIds[1]}`, '/#thank-you']) {
    await page.goto(address);
    await page.locator('.bar a[href="#contact-sheet"]').click();
    await expect(page.locator('main')).toHaveAttribute('data-view', 'sheet');
  }
});

test('found photos are counted and circled (AC-09)', async ({ page }) => {
  const second = storyTags.find(([, id]) => id !== storyTags[0][1]);
  await page.goto(`/?t=${second[0]}`);
  await page.goto('/#contact-sheet');
  await expect(page.locator('.progress strong')).toHaveText(`2 of ${taggedStories.length}`);
  await expect(page.locator('.sheet li.found')).toHaveCount(2);
  for (const id of [storyTags[0][1], second[1]]) {
    await expect(page.locator(`.sheet li.found a[href="#${id}"] svg.circle`)).toHaveCount(1);
  }
});

test('without the mission, finding every photo shows the completion note', async ({ page }) => {
  await withContent(page, (b) => {
    b.mission = { enabled: false };
    return b;
  });
  for (const [tag] of storyTags) await page.goto(`/?t=${tag}`);
  await page.goto('/#contact-sheet');
  await expect(page.locator('.complete')).toContainText(`You found all ${taggedStories.length}`);
});

test('larger text is remembered (AC-10)', async ({ page }) => {
  const button = page.locator('[data-action="text-size"]');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  const before = await page.locator('.prose p').first().evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
  await button.click();
  await expect(page.locator('html')).toHaveClass(/large/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/large/);
  await expect(page.locator('[data-action="text-size"]')).toHaveAttribute('aria-pressed', 'true');
  const after = await page.locator('.prose p').first().evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
  expect(after / before).toBeGreaterThan(1.15);
});

test('arrow keys turn the pages (AC-11)', async ({ page }) => {
  await page.goto(`/#${storyIds[1]}`);
  await page.keyboard.press('ArrowRight');
  await expectStory(page, storyIds[2]);
  await page.keyboard.press('ArrowLeft');
  await expectStory(page, storyIds[1]);
});

test('the heading takes focus on each new screen', async ({ page }) => {
  await page.goto(`/#${storyIds[1]}`);
  await expect(page.locator('h1')).toBeFocused();
  await page.locator('.pager .next').click();
  await expect(page.locator('h1')).toBeFocused();
});

test('draft text shows the Draft ribbon, finished text does not (AC-14)', async ({ page }) => {
  await withContent(page, (b) => {
    b.welcome = ['✎ Say hello'];
    return b;
  });
  await page.goto('/#cover');
  await expect(page.locator('.ribbon')).toContainText('Draft');
  await expect(page.locator('.prose p.draft')).toHaveCount(1);

  await page.unrouteAll();
  await withContent(page, (b) => JSON.parse(JSON.stringify(b).replace(/"✎\s*/g, '"Written: ')));
  await page.goto('/#cover');
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-view', 'cover');
  await expect(page.locator('.ribbon')).toHaveCount(0);
});

test('optional story parts render: voices, gallery, voice note, video', async ({ page }) => {
  const id = storyIds[0];
  await withContent(page, (b) => {
    const s = b.stories[0];
    s.voices = [
      { name: 'Huixin', text: 'We were both *late*.' },
      { name: 'Yongquan', text: 'I was early for the wrong café.' },
    ];
    s.gallery = Array.from({ length: 8 }, (_, i) => ({ src: 'images/extra-1.svg', alt: `Extra ${i}`, caption: `Caption ${i}` }));
    s.audio = { src: 'images/extra-1.svg', label: 'Hear Huixin tell it' };
    s.video = { url: 'https://example.com/video', label: 'Watch the proposal' };
    return b;
  });
  await page.goto(`/#${id}`);
  await page.reload();
  await expect(page.locator('.voice')).toHaveCount(2);
  await expect(page.locator('.voice em')).toHaveText('late');
  await expect(page.locator('.strip li')).toHaveCount(6);
  await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
  const video = page.locator('.media a.btn');
  await expect(video).toHaveAttribute('href', 'https://example.com/video');
  await expect(video).toHaveAttribute('target', '_blank');
});

test('wishes and album links show only when set; unsafe links are dropped', async ({ page }) => {
  await page.goto('/#cover');
  await expect(page.locator('.links')).toHaveCount(0);
  await withContent(page, (b) => {
    b.links = { wishes: 'https://forms.gle/example', album: 'javascript:alert(1)' };
    return b;
  });
  await page.reload();
  await expect(page.locator('.links a')).toHaveCount(1);
  await expect(page.locator('.links a')).toHaveAttribute('href', 'https://forms.gle/example');
  await expect(page.locator('.links a')).toContainText(`Leave ${plain(book.names[0])} & ${plain(book.names[1])} a wish`);
});

test('accent colour can be changed in the content file', async ({ page }) => {
  await withContent(page, (b) => ({ ...b, accent: '#2a6f4e' }));
  await page.goto('/#cover');
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-view', 'cover');
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--pencil').trim());
  expect(accent).toBe('#2a6f4e');
});

test('content is escaped, not run as code', async ({ page }) => {
  await withContent(page, (b) => {
    b.stories[0].title = '<img src=x onerror="window.__hacked=1">Hello';
    return b;
  });
  await page.goto(`/#${storyIds[0]}`);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('<img src=x onerror="window.__hacked=1">Hello');
  expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});
