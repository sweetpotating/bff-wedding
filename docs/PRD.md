# Product Requirements Document

## The Storybook Table: Huixin & Yongquan's wedding

| | |
|---|---|
| **Document** | Product Requirements Document (PRD) |
| **Version** | 1.0 (draft for the couple's review) |
| **Date** | 7 October 2026 |
| **Owner** | The organiser |
| **Approvers** | Huixin and Yongquan |
| **Business case** | [BRD](BRD.md). Requirement IDs `BR-xx` refer to it. |
| **Runbook** | [NFC setup and day-of runbook](NFC-SETUP.md) |

---

## 1. Summary

A small, fast website, **the storybook**, holds one chapter per photo on the reception table.
Each framed photo carries an NFC sticker storing a short link with a **tag number**. Tapping a
phone on the sticker opens that photo's chapter. The first tap also **opens the whole book on
that phone**, so the guest can read on, go back, or jump to any chapter from an overview styled
as a photographer's **contact sheet**. Photos the guest has tapped at the table are circled on
the contact sheet in red grease pencil, which nudges guests to find the rest. A QR code on the
table card does the same for phones without NFC.

There is no backend. The site is static, hosted free on GitHub Pages, and every word, photo and
tag mapping lives in one content file the couple can edit.

## 2. Goals and non-goals

**Goals**

1. Tapping tag *n* opens story *n* (BR-01), and any tap opens the whole book (BR-02).
2. Works first time on guests' own phones, on a weak signal, with nothing to install
   (BR-03, BR-04, BR-05).
3. The couple can change words, photos and the tag-to-story mapping without code and without
   rewriting tags (BR-06).
4. Feels like the couple's story, not a template (BR-10), and keeps the table minimal (BR-07).
5. Collects nothing about guests (BR-08) and costs nothing to host (BR-09).

**Non-goals (this release)**

- Accounts, comments, likes, uploads into the site, a native app (BR-19).
- Real access control. "Tap to open" is a soft gate for intrigue and casual privacy, not
  security: the content is public to anyone who has a tag link or reads the repository.
- A Chinese edition (BR-15). The content model leaves room for it (§15).

## 3. Glossary

| Term | Meaning |
|---|---|
| **Storybook** | The website. |
| **Story** (chapter) | One page of the book, tied to one photo on the table. |
| **Frame** | A framed photo on the table. Frame numbers follow the story order. |
| **Tag** | An NFC sticker on or beside a frame. |
| **Tag link** | The link stored on a tag: `https://sweetpotating.github.io/bff-wedding/?t=<tag id>`. |
| **Tag map** | The setting that says which story each tag id opens. |
| **Contact sheet** | The overview of all stories, styled like a photographer's sheet of every frame on a roll of film. |
| **Opened** | This phone has tapped a tag (or scanned the table-card QR), so the book is open on it. |
| **Found** | A story whose tag this phone has tapped at the table. |
| **Draft text** | Any text in the content file that starts with `✎`. It marks words the couple still has to write. |
| **Mission** | Optional game: every photo on the table is a **check-in**. Each check-in reveals one **mission word**; together the words form a message from the couple. Finding all of them wins a prize. |
| **Claim card** | A card held by a helper, with its own NFC tag (`?t=claim`). Tapping it marks the prize as collected on that phone. |

## 4. Experience overview

### Screens

| Screen | Address | Purpose |
|---|---|---|
| **Cover (closed)** | any address, before this phone has opened the book (tap mode only) | Names, a one-line promise, how to open the book |
| **Cover (open)** | `…/bff-wedding/` | Welcome note, start reading, see all frames, wishes and album links |
| **Story** | `…/bff-wedding/#<story-id>` | The story behind one photo |
| **Contact sheet** | `…/bff-wedding/#contact-sheet` | All stories, found marks, progress |
| **Thank-you page** | `…/bff-wedding/#thank-you`, after the last story | The couple's closing note, wishes link, back to the contact sheet |
| **Print kit** | `…/bff-wedding/print/` | Organiser only: tag sheet, tap-mark labels, table card |

### Guest journeys

**J1. First tap (iPhone XS or newer).** Guest wakes the phone and holds its top edge to the tap
mark on frame 7. iOS shows a banner with the link; the guest taps it. Safari opens
`…/?t=7`. The site opens the book on this phone, marks *The Proposal* as found, replaces the
address with `…/#the-proposal`, and shows the story. The photo "develops" into view. At the
bottom the guest taps *Frame 8: The Wedding Shoot →*.

**J2. First tap (Android).** NFC is on; the guest holds the middle of the phone's back to the
mark. Chrome (or Samsung Internet) opens the link directly. Then as J1.

**J3. No NFC.** The guest scans the QR code on the table card with the camera. It opens
`…/?t=0`, which opens the book and shows the contact sheet. Nothing is marked found, since no
photo was tapped.

**J4. Another tap.** The guest taps frame 4. A new browser tab opens *Taiwan*. A red grease-pencil
circle draws itself around frame 4 on the contact sheet: *Photos found at the table: 2 of 8.*

**J5. Signal drops.** After the first page loads, the phone quietly saves the whole book (text,
fonts and every story's main photo). Later taps and page turns work even with no signal. The
contact sheet says *Saved on this phone. Works without signal.*

**J6. A forwarded link.** A guest sends `…/#iceland` to someone who has not tapped anything. In
tap mode they see the closed cover: *This storybook opens when you tap a photo on the reception
table.* After the wedding the couple switches the book to open mode and every link works for
everyone.

**J7. Older guest.** A helper shows them how to tap. On the story page they tap **Aa** to
enlarge the text; the setting is remembered on that phone.

**J8. Content change (organiser).** The couple sends a new paragraph. The organiser edits
`site/content/storybook.json` (on GitHub's website or locally), runs `npm run check`, and
pushes. GitHub Pages publishes in about a minute. Phones that already have the book pick up the
new text the next time they open it online.

**J9. A tag fails on the day.** The helper peels the spare tag for that frame (written with the
same link) from the day-of kit and sticks it on. Nothing on the site changes.

**J10. After the wedding.** The organiser sets `"gate": "open"`, adds a chapter 9 such as *The
Big Day* with wedding photos, and the couple shares the link. The frames still work at home.

## 5. Addresses and routing

| Address | Behaviour |
|---|---|
| `https://sweetpotating.github.io/bff-wedding/?t=7` | **Tag entry.** Look up tag `7` in the tag map, open the book on this phone, mark the story found, then show it. The address becomes `…/#the-proposal`. |
| `…/bff-wedding/` | Cover. |
| `…/bff-wedding/#the-proposal` | Story with id `the-proposal`. |
| `…/bff-wedding/#contact-sheet` | Contact sheet. |
| `…/bff-wedding/#thank-you` | Thank-you page. |
| `…/bff-wedding/#anything-else` | Unknown story: show the cover. |
| `…/bff-wedding/print/` | Print kit. |
| `…/bff-wedding/any/other/path?t=7` | GitHub Pages serves `404.html`, which forwards to `…/bff-wedding/?t=7`. |
| `…/bff-wedding/?t=claim` | **Claim card** (mission mode): claims the prize if every photo is found, then shows the mission card. |

Rules:

- Tags only ever store `?t=<tag id>`, never a story id. Story ids can change; tag ids can't.
- Tag ids: 1–16 characters, `a–z`, `0–9`, `-`. Frames use `1`–`8`; the table-card QR uses `0`.
- Story ids: lowercase letters, digits and hyphens, unique, and not `cover`, `contact-sheet`,
  `thank-you` or `claim`.
- Internal navigation uses the `#` part only, so the site works on any static host with no
  server rules.

## 6. Functional requirements

Each requirement has acceptance criteria (AC) written as *Given / When / Then*. Automated tests
cover every AC marked **[auto]** (§13).

### A. Tag entry (BR-01, BR-02, BR-06)

| ID | Requirement |
|---|---|
| FR-01 | A tag stores `{siteUrl}?t={tagId}`. `siteUrl` comes from the content file. |
| FR-02 | On load with `t`, the site looks up `tags[tagId]`. The target is a story id, `contact-sheet` or `cover`. |
| FR-03 | Any tag entry, known or unknown, opens the book on this phone. |
| FR-04 | If the target is a story, the story is added to this phone's **found** list. |
| FR-05 | The address is replaced (no reload, no extra history entry) with `{siteUrl}#{target}`, so refreshing or sharing doesn't count as another tap. |
| FR-06 | An unknown tag id shows the contact sheet, marks nothing found, and logs a console warning. Guests see no error. |
| FR-07 | Changing the tag map and publishing changes where tags lead, without touching the tags. GitHub Pages may serve the old file for up to 10 minutes. |

- **AC-01 [auto]** *Given* a phone that has never visited, *when* it opens `?t=7`, *then* the
  story mapped to tag 7 is shown, the address ends in `#the-proposal` with no `?t=`, and the
  contact sheet shows that story as found.
- **AC-02 [auto]** *Given* the tag map, *when* each tag link is opened, *then* each shows its
  mapped target (every tag, not a sample).
- **AC-03 [auto]** *Given* a fresh phone, *when* it opens `?t=nope`, *then* the contact sheet is
  shown, the book is open, and nothing is found.

### B. Tap to open (BR-13)

| ID | Requirement |
|---|---|
| FR-08 | Setting `gate`: `"tap"` (default) or `"open"`. |
| FR-09 | In tap mode, a phone that hasn't opened the book sees the **closed cover** at every address. It shows the names, *This storybook opens when you tap a photo on the reception table*, short iPhone and Android hints, and a pointer to the table-card QR. |
| FR-10 | The opened state is stored on the phone (`localStorage`). If storage is blocked, it lasts for the current page visit and nothing breaks. |
| FR-11 | In open mode every address works directly. Tag links still record found stories. |

- **AC-04 [auto]** *Given* tap mode and a fresh phone, *when* it opens `/` or `#taiwan`, *then*
  it sees the closed cover and no story text.
- **AC-05 [auto]** *Given* a phone that opened `?t=1`, *when* it later opens `#iceland`
  directly, *then* the Iceland story is shown.
- **AC-06 [auto]** *Given* open mode, *when* a fresh phone opens `#iceland`, *then* the story is
  shown.

### C. Reading (BR-02, BR-10, BR-11, BR-12)

| ID | Requirement |
|---|---|
| FR-12 | **Cover (open):** eyebrow *The story behind the photos*, the couple's names, date and venue when set, the welcome note, **Start with frame 1** and **See all frames**, plus wishes and album links when set. |
| FR-13 | **Story page**, in order: film-edge strip with *Frame n of N*; optional kicker; title; handwritten caption (place and date); the photo as a bordered print (4:5) with alt text; body paragraphs; optional **In their words** notes from Huixin and Yongquan; optional gallery strip (up to 6 photos with captions); optional voice note (audio player, loads only when played); optional video link (opens outside the site); a *Found at the table* mark when found. |
| FR-14 | Every story has **previous** and **next**. The first story's previous goes to the cover. The last story's next goes to the **thank-you page** (the couple's closing note, wishes link, contact sheet). |
| FR-15 | **Contact sheet** is one tap away from every screen (top bar). It lists all stories in order with frame number, photo and title; each opens its story. Found stories are circled. It shows *Photos found at the table: X of Y*, where Y counts the distinct stories that have a tag. When X = Y it shows a completion note. |
| FR-16 | **Routing:** back and forward work; each screen change scrolls to the top and moves keyboard focus to the main heading; unknown addresses show the cover; ← and → turn pages on larger screens. |
| FR-17 | **Larger text:** an **Aa** button in the top bar switches between normal and large text (about 18% larger). The choice is remembered on the phone. |
| FR-18 | **Motion:** the story photo "develops" (from washed-out sepia to full colour, about 1.4 s) the first time a story opens in a visit, and a newly found frame's grease-pencil circle draws itself. Both are skipped when the phone asks for reduced motion. |

- **AC-07 [auto]** *Given* an opened phone on any story, *when* the guest follows **next**
  from frame 1, *then* every story is visited in order, ending at the thank-you page.
- **AC-08 [auto]** *Given* the contact sheet, *then* it lists exactly the stories in the content
  file, and each item opens its story.
- **AC-09 [auto]** *Given* tags 1 and 4 were tapped, *when* the contact sheet opens, *then* it
  reads *2 of 8* and exactly those two frames are circled.
- **AC-10 [auto]** *Given* the **Aa** button is on, *when* the page is reloaded, *then* large
  text is still on.
- **AC-11 [auto]** *Given* a story page, *when* the guest presses → on a keyboard, *then* the
  next story opens.

### D. Speed and offline (BR-05)

| ID | Requirement |
|---|---|
| FR-19 | After the first page loads, a service worker saves the app, the content file, the fonts and every story's main photo. Gallery photos are saved when first viewed. Voice notes and videos stream and need a connection. |
| FR-20 | When online, the newest app and content are used (network first, falling back to the saved copy after 4 s or when offline). Photos come from the saved copy instantly and refresh in the background. |
| FR-21 | On each load the page asks the service worker to save the main photos listed in the **current** content file, so new or renamed photos are saved without changing the service worker. |
| FR-22 | Once saving finishes, the contact sheet says *Saved on this phone. Works without signal.* |

- **AC-12 [auto]** *Given* a phone that opened `?t=1` and finished saving, *when* the site
  becomes unreachable and the phone opens another tag link, *then* that story renders with its
  photo loaded and is marked found.

### E. Links (BR-14)

| ID | Requirement |
|---|---|
| FR-23 | Optional `links.wishes` and `links.album` show as buttons (*Leave Huixin & Yongquan a wish*, *Share your photos from today*) on the open cover, the thank-you page and the contact sheet. They open in a new tab. Empty links are hidden. |

### F. Content workflow (BR-06, BR-08)

| ID | Requirement |
|---|---|
| FR-24 | One file, `site/content/storybook.json`, holds every word, the tag map and the settings. Photos live in `site/images/`. |
| FR-25 | **Draft text** (starting with `✎`) renders in a pencil style, and a *Draft* ribbon shows on every screen while any draft text remains. |
| FR-26 | `npm run check` validates the content file: JSON syntax (with line and column), required fields, story ids, tag map targets, photo and audio files exist inside `site/`, alt text on every photo, tag link length fits an NTAG213, photo sizes within budget, and that `404.html` and the link-preview image use the same address as `siteUrl`. It warns when a tag number differs from its story's frame number (the tap mark would say one number and the story another). Draft text is a warning. `npm run check:strict` also fails on draft text; it must pass before tags are locked and before the wedding. |
| FR-27 | `npm run photos -- <folder>` prepares photos: rotate upright, resize to at most 1600 px on the long edge, save as JPEG (quality 80), **strip all metadata including GPS**, write to `site/images/`, and print each file's size. |

- **AC-13 [auto]** The check fails on: a tag pointing to a missing story, a duplicate story id,
  a missing photo file, a missing alt text, and a reserved story id. It passes the starter
  content with warnings, and `--strict` fails it because of draft text.
- **AC-14 [auto]** *Given* draft text in the content, *then* the Draft ribbon is visible.

### G. Print kit (BR-03, BR-07)

| ID | Requirement |
|---|---|
| FR-28 | `/print/` builds three printable sections from the content file. **Tag sheet:** one row per tag with tag id, story title, the full link, its size on the tag, a QR code, and tick boxes (*written*, *tested on iPhone*, *tested on Android*, *locked*). **Tap-mark labels:** 30 mm round labels with the frame number, the word *tap* and contactless arcs, two per frame (one spare), to print on sticker paper and place over each NFC sticker. **Table card:** 4 × 6 in (fits a 4R frame or acrylic stand) with the instructions in §9.5 and the QR code for tag `0`. Every sheet carries a 50 mm ruler to check the print scale. |
| FR-29 | QR codes encode exactly the tag link (error correction M), dark on white with a quiet zone, and print at least 25 mm wide. Each tag link on the sheet is also a clickable link, for testing without tags. |

- **AC-15 [auto]** Every QR code on `/print/` decodes to `{siteUrl}?t={tagId}` for its row, and
  the table card's QR decodes to `{siteUrl}?t=0`.

### H. Hygiene (BR-08)

| ID | Requirement |
|---|---|
| FR-30 | Every page carries `<meta name="robots" content="noindex, nofollow">`. `robots.txt` disallows everything; crawlers only read it at a domain's root, so it takes effect with a custom domain, while the meta tag covers the `github.io` address. |
| FR-31 | `404.html` forwards any unknown path under the site to the site root, keeping `?t=`. |
| FR-32 | Link previews in chat apps show the title *Huixin & Yongquan* and *The story behind the photos*, with no personal photo. |

- **AC-16 [auto]** *Given* `…/bff-wedding/oops?t=3`, *then* the browser ends up on the story
  mapped to tag 3.

### I. Mission mode (BR-20, prototype)

The prize itself is still undecided (BRD Q11); everything below works whatever it is.

| ID | Requirement |
|---|---|
| FR-33 | Setting `mission.enabled` switches the game on or off. Off, the book behaves exactly as in sections A–H. |
| FR-34 | Each story on the table has a `word`. In frame order, the words form a message from the couple (sample: *Thank you for being part of our story*). |
| FR-35 | **Check-in:** a tag tap shows a *Checked in* stamp at the top of the story with that photo's word and the progress (*Photo 4 · 3 of 8 found*). Tapping a photo again says *Already checked in* and counts once. |
| FR-36 | A story read without tapping its photo keeps its word hidden: *Tap the round mark on photo 4 at the table to reveal this photo's word.* |
| FR-37 | The contact sheet becomes the **mission card**: the message with a numbered blank for each missing word, the progress, the prize, and each found frame's word under its circle. The top-bar button reads *Mission 3/8* on every screen. |
| FR-38 | When every photo is found: a *Mission complete* card with the full message, the prize, how to claim it, a claim code for this phone (e.g. `HY-7K3P`) and its claim status. The last check-in links straight to it. |
| FR-39 | **Claim card:** tapping the helper's `?t=claim` tag claims the prize once per phone and records the time. A second tap shows *Already claimed at 7:42 pm*; tapping before finishing shows *Not yet* with the progress. |
| FR-40 | The closed cover and the open cover mention the prize; the print kit adds the claim tag to the tag sheet, two ★ tap marks for the claim card, and *Find all 8 photos to win a prize* on the table card. |

- **AC-17 [auto]** *Given* mission mode, *when* a guest taps photo 4, *then* the story shows
  *Checked in*, photo 4's word, and the bar reads *Mission 1/8*.
- **AC-18 [auto]** *Given* one photo found, *then* the mission card shows its word and 7 blanks.
- **AC-19 [auto]** *Given* all photos found, *when* the claim card is tapped twice, *then* the
  first tap shows *Prize claimed* and the second *Already claimed*.
- **AC-20 [auto]** *Given* fewer than all photos found, *when* the claim card is tapped, *then*
  it shows *Not yet* and nothing is claimed.

**Limits.** Progress lives on the phone, so the claim card and the helper's eyes are the
check. Tag numbers are guessable (`?t=1` to `?t=8`); if the prize is worth gaming, switch the
tag ids to random strings (e.g. `?t=k7q2`), which the content file and print kit already
support. A live counter of finishers, or team scores by banquet table, would need a small
backend (§15).

## 7. Content model

All content lives in `site/content/storybook.json`. Text fields are plain text: `*word*` becomes
*italic*. Any text starting with `✎` is draft text (§6 FR-25).

### 7.1 Book settings

| Field | Type | Required | Notes |
|---|---|---|---|
| `siteUrl` | string | yes | Final public address, ending in `/`. Tag links and QR codes are built from it. |
| `names` | [string, string] | yes | `["Huixin", "Yongquan"]` |
| `eyebrow` | string | no | Line above the names. Default *The story behind the photos*. |
| `date`, `venue` | string | no | Shown on the cover when set and not draft. |
| `welcome` | string[] | yes | 1–3 short paragraphs from the couple on the open cover. |
| `closing` | string[] | yes | The couple's note on the thank-you page. |
| `gate` | `"tap"` \| `"open"` | yes | §6 B. |
| `links.wishes`, `links.album` | string (https) | no | §6 E. Empty string hides the button. |
| `accent` | CSS colour | no | Overrides the accent colour (the grease-pencil red) to match the wedding palette. |
| `mission` | `{enabled, prize, claim}` | no | §6 I. `prize`: what finishers get. `claim`: how to claim it, e.g. *Show this screen to Mei at the guestbook table*. |
| `tags` | object | yes | Tag id → story id, `contact-sheet` or `cover`. |
| `stories` | Story[] | yes | In frame order. |

### 7.2 Story

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Appears in the address, e.g. `taiwan`. |
| `title` | string | yes | e.g. *Taiwan*. |
| `kicker` | string | no | Small line above the title, e.g. *Adventure 1 of 3*. |
| `word` | string | in mission mode | The mission word this photo reveals when tapped. |
| `caption` | string | no | Handwritten line under the title: where and when, e.g. *Jiufen, March 2019*. |
| `photo` | `{src, alt, position?}` | yes | Main photo. Cropped to 4:5 on screen; `position` (CSS `object-position`, e.g. `"50% 30%"`) keeps faces in frame. |
| `body` | string[] | yes | 1–5 paragraphs, 80–200 words in total (about a one-minute read). |
| `voices` | `{name, text}[]` | no | **In their words.** One short note each from Huixin and Yongquan, 40 words or fewer. |
| `gallery` | `{src, alt, caption?}[]` | no | Up to 6 extra photos. |
| `audio` | `{src, label}` | no | Voice note (`.m4a` or `.mp3`, under 1 MB). |
| `video` | `{url, label}` | no | Link to a video hosted elsewhere (e.g., an unlisted YouTube video). |

### 7.3 Sample storyline and tag map

| Tag | Story id | Title | Kicker |
|---|---|---|---|
| 0 | `contact-sheet` | *(table-card QR: the overview)* | |
| 1 | `how-we-met` | How We Met | |
| 2 | `first-date` | Our First Date | |
| 3 | `when-we-knew` | When We Knew | |
| 4 | `taiwan` | Taiwan | Adventure 1 of 3 |
| 5 | `iceland` | Iceland | Adventure 2 of 3 |
| 6 | `new-zealand` | New Zealand | Adventure 3 of 3 |
| 7 | `the-proposal` | The Proposal | |
| 8 | `wedding-shoot` | The Wedding Shoot | |
| claim | `claim` | *(the helper's claim card, mission mode)* | |

The starter content ships every story with writing prompts as draft text, so the couple can
write straight into the file.

### 7.4 Photos

- Supply originals as JPEG or PNG. iPhone HEIC photos need exporting as JPEG first (Photos app:
  *File → Export*), or AirDrop with *Options → Most Compatible*.
- Run `npm run photos -- <folder>`. Output is at most 1600 px on the long edge, usually
  150–350 KB, with all metadata removed.
- Print the table photos from the **originals**, not the web copies.
- For the main photo of each story, pick a picture that still works cropped to portrait 4:5.

## 8. Writing guide for the couple

- Write as if talking to a friend at the table. Short paragraphs, one memory per paragraph.
- Aim for a one-minute read per story: 80–200 words, plus an optional 1–2 sentence note from
  each of you.
- Name places and dates in the caption, not the body: *Jiufen, March 2019*.
- One specific detail beats a summary: the song in the car, the thing that went wrong, what
  someone said.
- Avoid in-jokes that only two people understand, unless you explain them in one line.
- Everything is readable by anyone with a tag link. Leave out anything you wouldn't say in a
  wedding speech.

## 9. NFC and physical specification

### 9.1 Tags

- **Chip:** NTAG213 (144 bytes) is enough; NTAG215 also works. Round stickers, 25–30 mm.
- **Metal:** a normal tag will not read on or right next to metal. For a metal frame use
  *on-metal* (anti-metal) tags, or put the tag on the label or stand instead.
- **Quantity:** two per frame (one installed, one spare written with the same link) plus 4
  blanks: **20 for 8 frames.**

### 9.2 Link format and size

`https://sweetpotating.github.io/bff-wedding/?t=7` is 48 characters. Written as an NDEF URI
record, `https://` compresses to one byte, so the payload is 41 bytes and the whole record is
under 50 bytes, well inside the 144 bytes of an NTAG213. The check (FR-26) warns if a link would
not fit.

### 9.3 Writing and locking

Use the free **NFC Tools** app (iPhone or Android): *Write → Add a record → URL/URI* → paste the
tag link → *Write* → hold the tag to the phone. Read it back to confirm. **Lock** a tag (*Other
→ Lock tag*) only after it passes the venue test; locking is permanent. Full steps are in
[NFC-SETUP.md](NFC-SETUP.md).

### 9.4 Placement

- One tap mark per frame, on the front lower corner of the frame or on its stand. The printed
  round label sits **over** the NFC sticker, so guests see the mark, not the chip.
- Keep tags at least **8 cm apart** so phones don't read the neighbouring tag.
- Arrange frames 1 → 8 from left to right so the table reads as a timeline.
- The tap mark is our own design (frame number, *tap*, contactless arcs). Do not use the NFC
  Forum "N-Mark", which is a trademark.

### 9.5 Table card copy (4 × 6 in)

> **The story behind the photos**
>
> Every photo on this table has a story. Tap your phone on the round mark beside any photo to
> read it.
>
> **iPhone:** hold the top of your phone to the mark, then tap the banner that appears.
> **Android:** make sure NFC is on, then hold the middle of your phone's back to the mark.
>
> No NFC? Scan this code. *(QR for tag 0)*
>
> Thick cases or card wallets can block the tap.

### 9.6 Device notes

| Phone | How it reads tags |
|---|---|
| iPhone XS / XR and newer | Built in. The screen must be awake; a banner appears and the guest taps it. |
| iPhone 7, 8, X | Only through the *NFC Tag Reader* in Control Center. Easier: scan the QR. |
| Android with NFC | NFC must be switched on (*Settings → Connected devices → NFC*). Opens the browser directly. |
| Phones without NFC | QR code on the table card. |

## 10. Non-functional requirements

### 10.1 Performance budgets

| Measure | Budget |
|---|---|
| App code: HTML + CSS + JS + content file | ≤ 120 KB uncompressed, ≤ 40 KB compressed (built: 58 KB and 15 KB) |
| Fonts | ≤ 160 KB total (woff2, Latin only), `font-display: swap` so text never waits for fonts (built: 116 KB) |
| Each photo | ≤ 400 KB (check warns above that) |
| All main photos together (saved in the background) | ≤ 3 MB |
| Story text visible after a tap, on a slow 4G connection | ≤ 2 s |
| Story photo visible, slow 4G | ≤ 3 s |
| Third-party requests at runtime | none |

### 10.2 Compatibility

- iPhone: Safari on iOS 15 or newer. Android: Chrome 100+ and Samsung Internet 18+.
- Desktop Chrome, Safari, Firefox and Edge (current versions) for the couple and the organiser.
- Phone widths from 320 px. The page never scrolls sideways.
- Without JavaScript, a short message explains the book needs it.

### 10.3 Accessibility (WCAG 2.2 AA as the target)

- Text contrast at least 4.5:1 in light and dark mode.
- Every photo has alt text; decorative graphics are hidden from screen readers.
- Tap targets at least 44 × 44 px; visible keyboard focus.
- Works with the phone's own text size settings, plus the **Aa** toggle.
- Landmarks (`header`, `main`, `nav`), one `h1` per screen, page language set.
- Motion respects *reduce motion*.

### 10.4 Privacy and security

- No cookies, no analytics, no third-party scripts or fonts.
- The phone stores only: whether the book is open, which stories were found, and the text size.
  Nothing is sent anywhere.
- Photo metadata (including GPS location) is stripped by `npm run photos`.
- Not listed in search engines (FR-30).
- A Content-Security-Policy meta tag allows only the site's own files.
- Tags are locked after testing so they can't be rewritten.
- **Known limit:** the repository is public, so the content file and photos can be read there.
  See BRD §10 and open question Q6.

### 10.5 Reliability

- No server to fail; GitHub Pages serves static files over HTTPS.
- Offline after the first load (FR-19).
- Spare tags with the same link; QR fallback; a test phone in the day-of kit.

### 10.6 Maintainability and longevity

- No framework and no build step: plain HTML, CSS and JavaScript, served as committed.
- No runtime dependencies. Development tools (tests, photo script) are dev-only.
- All paths are relative, so the `site/` folder works on any static host.
- Continuous integration runs the content check and the browser tests on every push and
  publishes `main` to GitHub Pages.
- Target: online and working for at least 12 months after the wedding.

## 11. Design direction: "the back of the photo"

**Concept.** When a guest taps a photo on the table, their phone shows what would be written on
the back of that print: where it was, when, and the story, in the couple's handwriting and
voice. The overview is a **contact sheet**, the sheet a photographer prints with every frame of
a roll, where the chosen frames are circled in red grease pencil. Here, the frames a guest has
found at the table get circled.

**Why it fits.** It links the physical photos to the digital story, it gives the progress
mechanic a natural form, and it avoids generic wedding-template styling.

**Palette (tokens).** `paper` (photo-paper white), `ink` (warm near-black), `rebate` (film
black, for the contact sheet strips), `edge` (amber, like the edge print on film), `pencil`
(grease-pencil red, the single accent). Dark mode is a darkroom: near-black paper, warm light
ink, a slightly brighter red. `accent` in the content file can swap the red for the wedding
colour.

**Type.**
- *Alegreya*, a serif designed for literature, for titles and story text.
- *Nothing You Could Do*, a ballpoint handwriting face, for captions, notes and found marks.
- *DM Mono* for film-edge labels (*FRAME 7 OF 8*, *HUIXIN & YONGQUAN*).

All three are open-licence (OFL) and self-hosted.

**Motion.** One moment each: the photo develops in when a story opens, and the grease-pencil
circle draws itself the first time a frame is found. Nothing else moves.

**Tap mark.** A 30 mm circle: the frame number large in the centre, *tap* above it, and
contactless arcs, in ink on white.

## 12. Technical architecture

```text
site/                       published as-is to GitHub Pages
  index.html                app shell
  assets/app.js             routing, tap entry, open/closed, rendering, saved state
  assets/styles.css         tokens, layout, light/dark
  assets/fonts/             self-hosted woff2 + licence
  assets/vendor/qrcode.js   QR encoder for the print kit (MIT)
  assets/og.png, icon.svg   link-preview image and browser icon
  content/storybook.json    all words, tag map, settings
  images/                   photos (prepared with npm run photos)
  print/                    print kit (tag sheet, tap marks, table card)
  sw.js                     offline saving (service worker)
  404.html                  forwards unknown paths to the root, keeping ?t=
  robots.txt
scripts/
  check.mjs                 content check (FR-26)
  photos.mjs                photo preparation (FR-27)
  serve.mjs                 local preview server
tests/                      browser tests (Playwright) and unit tests (node:test)
.github/workflows/          test on every push; publish main to GitHub Pages
```

**Flow on a tap.** `index.html` loads `styles.css` and `app.js` and preloads the content file.
`app.js` reads `?t=`, updates the saved state (`storybook:v1:opened`, `storybook:v1:found`;
`storybook:v1:large` holds the text size),
rewrites the address to `#<story-id>`, then renders the route. It registers `sw.js`, which saves
the app shell on install. The page then posts the list of main photos from the current content
file to the service worker, which saves any that are missing and reports back when done.

**Caching.** HTML, JS, CSS and the content file: network first with a 4 s timeout, then the
saved copy. Photos, fonts and audio: saved copy first, refreshed in the background.

**Hosting.** GitHub Pages, deployed by GitHub Actions from `main`. The repository is public.
A custom domain can be added at any time; GitHub forwards the `github.io` address to it, so
locked tags keep working.

## 13. Quality plan

### 13.1 Automated (runs in CI on every push)

| Suite | Covers |
|---|---|
| Content check (unit) | AC-13 |
| Tag entry and routing | AC-01, AC-02, AC-03, AC-16 |
| Tap to open | AC-04, AC-05, AC-06 |
| Reading and navigation | AC-07, AC-08, AC-09, AC-10, AC-11, AC-14 |
| Offline | AC-12 |
| Print kit | AC-15 (decodes every QR code) |
| Mission | AC-17 to AC-20, repeat taps, hidden words, prize mentions, reset, mission switched off |
| Layout | No sideways scrolling at 320 px and 390 px on every screen; one `h1`; alt text on every image; no console errors (including Content-Security-Policy violations) |
| Robustness | Blocked storage still opens the book for the visit; content is escaped, never run as code; unsafe links are dropped; reduced motion skips animation |

### 13.2 Manual device matrix (W − 3 weeks and the venue rehearsal)

| Device | Check |
|---|---|
| iPhone (newest available), iOS current | Tap each tag; banner; story; offline after first tap; dark mode; large text; VoiceOver quick pass |
| Older iPhone (8 or X) if available | QR from the table card |
| Samsung Galaxy (Samsung Internet) | Tap each tag; story; contact sheet |
| Google Pixel or Xiaomi (Chrome) | Tap each tag; NFC-off behaviour; QR |
| Laptop | The couple's review of all text; print kit printing at 100% scale |

### 13.3 Venue rehearsal (W − 1 week)

Real frames, real stands, real table: every tag read by an iPhone and an Android through the
frame materials; QR read from 30 cm in the table's lighting; mobile signal noted at the table.

## 14. Release plan and go / no-go

**Go** only when all of these are true:

1. `npm run check:strict` passes: no draft text left, every photo present.
2. CI is green on `main` and the site is live at the tag link address.
3. The couple has signed off every story on their own phones.
4. Every tag is written, tested on iPhone and Android, and locked; spares written and labelled.
5. Tap mode chosen (`"tap"` or `"open"`) and published.
6. Day-of kit packed (see [NFC-SETUP.md](NFC-SETUP.md)).

Release steps follow the BRD timeline (§13 there).

## 15. Later options

| Option | Notes |
|---|---|
| Chinese edition (BR-15) | Add `zh` versions of text fields and a language switch; system fonts already cover Chinese. |
| Voice notes (BR-16) | Already supported by `audio`; needs recordings. |
| Tap counts (BR-17) | A cookie-less counter such as GoatCounter. It adds one third-party request; update §10.4. |
| *The Big Day* chapter (BR-18) | Add a story after the wedding; no tag needed. |
| Mission extras (BR-20) | Live "37 guests finished" counter or team scores by banquet table (needs a small backend); a lucky-draw form prefilled with the claim code; random tag ids. |
| Custom domain | Point a domain at GitHub Pages; tags keep working. |

## 16. Open product questions

See BRD §14. Product-specific ones:

1. Keep **In their words** for every story, or only some?
2. Does the thank-you page need a short video message from the couple?
3. Should the contact sheet hide stories that are not on the table (e.g., a later *The Big Day*)
   from the found count? (Current rule: Y counts only stories that have a tag.)

## 17. Traceability

| BR | Covered by |
|---|---|
| BR-01 | FR-01–FR-07, §9 |
| BR-02 | FR-03, FR-14, FR-15, FR-16 |
| BR-03 | FR-28, FR-29, §9.5 |
| BR-04 | §10.2, §13.2 |
| BR-05 | FR-19–FR-22, §10.1 |
| BR-06 | FR-07, FR-24–FR-27 |
| BR-07 | §9.4 |
| BR-08 | FR-30, §10.4 |
| BR-09 | §12 Hosting |
| BR-10 | §11 |
| BR-11 | FR-15, FR-18 |
| BR-12 | FR-17, §10.3 |
| BR-13 | FR-08–FR-11 |
| BR-14 | FR-23 |
| BR-15–BR-18 | §15 |
| BR-20 | FR-33–FR-40 |
