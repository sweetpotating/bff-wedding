# bff-wedding: The Storybook Table

An NFC-linked online storybook for Huixin and Yongquan's wedding. `README.md` is the guide;
`docs/BRD.md` and `docs/PRD.md` hold the requirements (FR-xx / AC-xx ids); `docs/NFC-SETUP.md`
is the tag and day-of runbook.

## Rules that keep the tags working

- NFC tags store `{siteUrl}?t=<tag id>` and get locked. Never change `siteUrl`, the tag ids,
  the repository name or the GitHub account name once tags are written.
- Which story a tag opens is only `tags` in `site/content/storybook.json`. Change content
  there, never in code.
- Reserved ids (story ids can't use them): `cover`, `contact-sheet`, `thank-you`, `claim`.
  `claim` is the helper's prize claim card in mission mode.

## Code

- `site/` is published as-is to GitHub Pages: plain HTML/CSS/JS, no build step, no runtime
  dependencies, relative paths only.
- A Content-Security-Policy meta tag allows only same-origin files: no inline scripts, no
  inline `style` attributes in rendered HTML (set styles through CSSOM, as `wire()` does), no
  third-party requests.
- Escape all content with `esc()` / `fmt()` in `app.js`. Text starting with `✎` is draft text.
- Colours are tokens in `styles.css` with light and dark values; prints (photo borders) stay
  light in both themes.
- Bump `VERSION` in `sw.js` only when its own logic changes.

## Commands

```bash
npm install
npm start               # http://localhost:4173, open /?t=1 to act as a tag tap
npm run check           # content check (check:strict also fails on ✎ draft text)
npm test                # unit (node:test) + browser tests (Playwright, Chromium)
npm run photos -- dir/  # resize and strip metadata into site/images
```

Run `npm run check` and `npm test` before committing. Content-swapping browser tests block
service workers; the offline test runs its own server. Do not open pull requests unless asked.
