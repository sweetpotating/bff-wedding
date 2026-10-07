# The Storybook Table: Huixin & Yongquan

An online storybook for Huixin and Yongquan's wedding. Each framed photo on the reception table
carries a small NFC sticker. Tap a phone on it and that photo's story opens. The first tap opens
the whole book on that phone, so guests can read every chapter. Photos they've tapped at the
table get circled on the book's contact sheet, which nudges them to find the rest.

- **Live site:** <https://sweetpotating.github.io/bff-wedding/> (once GitHub Pages is switched
  on, see [Going live](#going-live))
- **Why and what:** [BRD](docs/BRD.md) (business requirements) and [PRD](docs/PRD.md) (product
  requirements)
- **Tags and the wedding day:** [NFC setup and day-of runbook](docs/NFC-SETUP.md)

## How it works

```text
NFC sticker on frame 4  ──stores──▶  https://sweetpotating.github.io/bff-wedding/?t=4
                                                    │
                    site/content/storybook.json:  "tags": { "4": "taiwan" }
                                                    ▼
                      the phone opens the book, marks "Taiwan" found, shows …/#taiwan
```

Tags only store a tag number. The content file decides which story each number opens, so
stories can be rewritten, reordered or swapped at any time without touching the tags.

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm start                 # http://localhost:4173
```

Open <http://localhost:4173/?t=1> to act as if you tapped frame 1, and
<http://localhost:4173/print/> for the print kit. To start over as a new guest, use a private
window.

## Editing the stories

Everything guests read lives in **`site/content/storybook.json`**. You can edit it on GitHub's
website (open the file, click the pencil, commit) or locally.

The sample storyline has 8 chapters: how we met, our first date, when we knew, Taiwan, Iceland,
New Zealand, the proposal, and the wedding shoot. Each starts with writing prompts marked `✎`.
Replace each prompt with the real text and delete the `✎`. While any `✎` text remains, the
site shows a small *Draft* ribbon.

A finished story looks like this (example values):

```json
{
  "id": "taiwan",
  "kicker": "Adventure 1 of 3",
  "title": "Taiwan",
  "caption": "Taipei and Jiufen, March 2019",
  "photo": { "src": "images/taiwan.jpg", "alt": "Huixin and Yongquan on the steps in Jiufen at dusk", "position": "50% 35%" },
  "body": ["First paragraph…", "Second paragraph… *italic* works."],
  "voices": [
    { "name": "Huixin", "text": "One or two sentences in Huixin's own words." },
    { "name": "Yongquan", "text": "One or two sentences in Yongquan's own words." }
  ],
  "gallery": [{ "src": "images/taiwan-2.jpg", "alt": "…", "caption": "…" }],
  "audio": { "src": "audio/taiwan.m4a", "label": "Hear Huixin tell it" },
  "video": { "url": "https://youtu.be/…", "label": "Watch the video" }
}
```

`kicker`, `caption`, `voices`, `gallery` (up to 6), `audio` and `video` are optional. The
[PRD §7](docs/PRD.md#7-content-model) describes every field, and §8 has a short writing guide
for the couple.

Book settings at the top of the file:

| Setting | What it does |
|---|---|
| `siteUrl` | The live address. Tag links and QR codes are built from it. **Don't change it after tags are locked.** |
| `names`, `eyebrow`, `date`, `venue`, `welcome`, `closing` | Cover and thank-you page text. |
| `gate` | `"tap"`: the book opens on a phone after a tag tap or the table-card QR. `"open"`: anyone with the link can read it (use after the wedding). |
| `links.wishes`, `links.album` | Optional https links, e.g. a Google Form for wishes or a shared photo album. Empty hides the button. |
| `accent` | Optional colour (e.g. `"#8a5a44"`) to replace the grease-pencil red with the wedding colour. |
| `tags` | Tag number → story id. `"0": "contact-sheet"` is the table-card QR code. |

## Adding photos

Put the originals in a folder (for example `photos/`, which git ignores), then:

```bash
npm run photos -- photos/
```

This rotates each photo upright, shrinks it to at most 1600 px, saves it as a JPEG of about
150–350 KB in `site/images/`, and **removes all metadata, including GPS location**. Then set
each story's `photo.src` to the new file, for example `images/taiwan.jpg`. iPhone HEIC photos
need exporting as JPEG first (Photos app: *File → Export*). Print the table photos from the
originals, not from these web copies.

## Checking and testing

```bash
npm run check          # content check: ids, tag map, photo files, alt text, tag size
npm run check:strict   # also fails while any ✎ draft text remains; must pass before the wedding
npm test               # unit tests and browser tests (Playwright)
```

Browser tests need a one-time `npx playwright install chromium`.

## Going live

1. Merge the work into the `main` branch.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` then runs the check and the tests and publishes `site/` to
   <https://sweetpotating.github.io/bff-wedding/> within a couple of minutes.
4. Once the stories are final, add a repository variable `STRICT_CHECK` = `true`
   (**Settings → Secrets and variables → Actions → Variables**), so draft text can never be
   published.

Then write the tags: [NFC setup and day-of runbook](docs/NFC-SETUP.md).

## Privacy

- Guests sign up for nothing, and the site stores nothing about them. Each phone only remembers
  whether the book is open, which photos it found, and the text size.
- Every page asks search engines not to index it.
- **This repository is public**, so anything committed here (stories and photos) can be read on
  GitHub. If the couple wants that private, make the repository private and host `site/` on a
  service that publishes private repositories for free, such as Cloudflare Pages or Netlify.
  Decide before adding real photos. See BRD open question Q6.

## Project layout

```text
site/                      the website, published as-is
  index.html               app shell
  assets/app.js            tag entry, routing, rendering
  assets/styles.css        design (light and dark)
  assets/fonts/            Alegreya, Nothing You Could Do, DM Mono (SIL OFL)
  assets/vendor/qrcode.js  QR code generator by Kazuhiko Arase (MIT)
  content/storybook.json   all words, the tag map and settings
  images/                  photos (placeholders until the real ones arrive)
  print/                   print kit: tag sheet, tap marks, table card
  sw.js                    saves the book on the phone for weak signal
  404.html                 sends mistyped links to the front page, keeping ?t=
scripts/                   check.mjs, photos.mjs, serve.mjs
tests/                     unit tests (node:test) and browser tests (Playwright)
docs/                      BRD, PRD, NFC runbook
```
