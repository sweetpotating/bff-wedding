# NFC setup and day-of runbook

How to buy, write, test, place and lock the NFC tags, and what to do on the wedding day.
Requirements behind this are in the [PRD](PRD.md) §9.

## 1. What to buy

For 8 frames:

| Item | Quantity | Notes |
|---|---|---|
| NFC stickers, **NTAG213** (or NTAG215), round, 25–30 mm | **20** | 2 per frame (one is the spare) + 4 blanks. White or clear. |
| On-metal NFC tags | 4–10 | Only if any frame is metal. Normal tags don't read on metal. |
| White sticker paper (or 30 mm round label sheets) | 1 pack | For the tap marks that cover each NFC sticker. |
| Card stock | 2 sheets | For the table card (4 × 6 in, fits a 4R frame or acrylic stand). |
| Double-sided tape, scissors | – | For the day-of kit. |

Install the free **NFC Tools** app (by wakdev) on your phone. It works on iPhone XS and newer and
on Android phones with NFC.

## 2. Before you write any tag

1. **The address is final.** Tag links contain `siteUrl` from `site/content/storybook.json`
   (currently `https://sweetpotating.github.io/bff-wedding/`). Once tags are locked it can never
   change. Decide now about a custom domain (if you want one, set it up first; GitHub forwards
   the `github.io` address to it, so tags written with either keep working).
2. **The site is live.** Open `https://sweetpotating.github.io/bff-wedding/?t=1` on a phone **on
   mobile data** (not your home Wi-Fi). It should open frame 1.
3. **The tag map is final.** `npm run check` shows no warnings about tag numbers. Stories can
   still change later; which number goes on which frame should not.
4. **Print the kit.** Open `…/bff-wedding/print/` on a laptop and print at 100% scale. Check the
   50 mm ruler on each sheet. You'll use the tag sheet as a checklist.

## 3. Write the tags

Each frame gets **two** stickers with the same link: one goes on the frame, one goes in the
day-of kit as its spare. Label the spares (a pencil number on the backing paper is enough).

In NFC Tools:

1. **Write → Add a record → URL / URI.**
2. Enter the link from the tag sheet, e.g. `https://sweetpotating.github.io/bff-wedding/?t=4`.
   If the app shows a separate prefix menu, choose `https://` and type the rest.
3. Tap **OK**, then **Write** (it shows the size, about 48 bytes).
4. Hold the sticker to the phone: the top edge of an iPhone, the middle of the back of most
   Android phones. Wait for "Write complete".
5. Switch to **Read** and scan the sticker again to check the link.

Do **not** lock yet.

## 4. Test every tag

Close NFC Tools first: an open NFC app catches the tag instead of the browser.

For each sticker, with an iPhone and with an Android phone:

| Check | Expected |
|---|---|
| Hold the phone to the tag | iPhone: a banner appears; tap it. Android: the browser opens. |
| What opens | The story named in the tag sheet's "Opens" column. |
| The story page | Says "found at the table ✓" under the photo. |

Tick *Written*, *iPhone* and *Android* on the tag sheet as you go. To reset a test phone (so it
behaves like a guest's), open the site in a private window.

## 5. Put the tags on the frames

- One tap mark per frame, on the **front lower corner** of the frame or on its stand.
- Stick the NFC sticker first, then the printed round tap mark **directly over it**, so guests
  see the mark, not the chip.
- Keep tags at least **8 cm apart**, or a phone may read the neighbouring one.
- Never on metal. Behind glass or acrylic up to about 3 mm is usually fine; test it.
- Put the frames in order, 1 to 8, left to right.

## 6. Venue rehearsal (one week before)

Set up the real frames on the real table, or the closest copy you can make:

- Every tag reads through the actual frame materials, on iPhone and Android.
- The QR code on the table card scans from 30 cm in the table's lighting.
- Note the mobile signal at the table. If it's weak, ask the venue for guest Wi-Fi and add the
  name to the table card by hand.

## 7. Lock the tags

Only after the rehearsal passes. In NFC Tools: **Other → Lock tag** → confirm → hold the
sticker to the phone. **Locking is permanent**: the tag can still be read but never rewritten,
so nobody can change it at the wedding. Lock the spares too. Tick *Locked* on the tag sheet.

Keep the 4 blank stickers unlocked for emergencies.

## 8. Day-of kit

- The printed tag sheet (it lists every link).
- The spare stickers, one per frame, labelled.
- 4 blank stickers and a phone with NFC Tools installed and charged.
- Spare tap marks, a spare table card, double-sided tape, scissors.

## 9. On the day

| When | What |
|---|---|
| 60 min before guests | Set out the frames in order with their tap marks; table card at the front where people arrive. |
| 45 min before | Test every tag with an iPhone and an Android phone, and the QR code. |
| 30 min before | Brief the helper (below). |
| First hour | Helper stays near the table. |
| After the reception | Pack the frames carefully; the tags stay on and keep working at home. |

**What the helper says:** "Each photo has a little round *tap* mark. Hold the top of your phone
to it. On an iPhone a banner pops up; tap it. Then you can read all the stories, not just that
one."

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| iPhone: nothing happens | Wake the screen. Hold the very top edge flat on the mark for a second or two. Take off a thick case or MagSafe wallet. Close the Camera and Wallet apps. iPhone 8 or X: use the QR code. |
| Android: nothing happens | Turn on NFC (*Settings → Connected devices → NFC*, or search "NFC"). Unlock the phone. Try the middle of the back, then near the camera. |
| The wrong story opens | Read the tag in NFC Tools and compare with the tag sheet. If the tag number is right, fix `tags` in `storybook.json` and publish; no need to touch the tag. |
| The contact sheet opens instead of a story | That tag number isn't in `tags`. Add it to `storybook.json` and publish. |
| The neighbouring photo's story opens | Tags are too close. Move them at least 8 cm apart. |
| The page doesn't load | Weak signal. Use venue Wi-Fi or the QR code later. Anyone who has opened the book once can keep reading offline. |
| A tag is dead or missing | Stick on that frame's spare, with a spare tap mark over it. |
| Everything fails | The photos on the table still work as decor. Share `…/bff-wedding/?t=0` later. |

## 11. After the wedding

- In `storybook.json`, set `"gate": "open"` so anyone with the link can read the book, and add
  a chapter such as *The Big Day*. Publish. The tags keep working.
- Share `https://sweetpotating.github.io/bff-wedding/` with family and friends who couldn't come.
- Keep the repository and the GitHub account name as they are, so the tags keep working at home.
