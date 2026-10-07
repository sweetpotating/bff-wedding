# Business Requirements Document

## The Storybook Table: Huixin & Yongquan's wedding

| | |
|---|---|
| **Document** | Business Requirements Document (BRD) |
| **Project** | The Storybook Table: an NFC-linked online storybook for the reception |
| **Version** | 1.0 (draft for the couple's review) |
| **Date** | 7 October 2026 |
| **Sponsors / approvers** | Huixin and Yongquan |
| **Project owner** | The organiser (the couple's friend who is building it) |
| **Companion documents** | [PRD](PRD.md) (what we build), [NFC setup and day-of runbook](NFC-SETUP.md) |

---

## 1. Executive summary

One reception table outside the hall will carry the wedding's photo display. Usually that means
either a few nice photos with no story, or a crowded table of captions, timelines and signs that
nobody reads.

**The Storybook Table** keeps the table clean and moves the story onto guests' phones. Each framed
photo gets a small, discreet NFC sticker. When a guest taps their phone on it, the phone opens
**the story behind that photo**: the moment in Huixin and Yongquan's own words, with the extra
photos the frame couldn't hold. Every tag opens its own story, and once a guest is in, **the
whole storybook is open to them**. They can read on to the next chapter or jump to any other.

The storybook is a small website. It needs no app, no sign-up and no paid hosting. After the
wedding the frames go home with the couple and keep working as a keepsake.

## 2. Background and problem

- **The setting.** Guests gather at the reception tables outside before and between the
  festivities. They have time to fill, and the photo table draws them in.
- **The tension.** Photos alone don't tell the story: how they met, the proposal, the in-jokes.
  Printing that story onto the table (cards, captions, timelines) clutters the decor and is
  hard to read standing up.
- **The opportunity.** Nearly every guest carries a phone that can read NFC. A sticker the
  size of a coin can hold a link, so the table stays elegant and the story lives one tap away.
- **What has to be true.** It has to work the first time for every guest, including older
  relatives, guests without NFC, and anyone on a weak signal, because there is only one
  wedding day.

## 3. Vision

> You arrive early, drink in hand, and drift to the reception table. Eight framed photos
> stand among the flowers, in order from the day Huixin and Yongquan met to their wedding
> shoot. Beside each is a small round mark with a number and the word *tap*. You hold your
> phone to photo 7. A banner pops up, and one tap later you're reading *"The Proposal"*, told
> in both their voices, with two more photos the frame couldn't hold. At the bottom it says
> *Frame 8: The Wedding Shoot →*, so you read on. Your overview of all eight photos shows
> frame 7 circled in red pencil: *Photos found at the table: 1 of 8.* You tap the three
> travel photos (Taiwan, Iceland, New Zealand) before the doors open.
>
> A week later the eight frames sit on a shelf in Huixin and Yongquan's home, and they still work.

**In one line:** *every photo on the table tells its own story when you tap it, and any tap
opens the whole book.*

## 4. Business objectives and success measures

| # | Objective | Success measure (target) | How we know |
|---|---|---|---|
| BO1 | Keep the table elegant and uncluttered while telling a richer story | At most 8 framed photos plus 1 small table card; no caption boards or text panels | Photo of the finished table, approved by the couple |
| BO2 | Engage guests while they wait | At least half of guests (or at least one person per household) open one or more stories; readers average 3 or more stories | Couple's and helpers' observation. Exact counts need the optional, privacy-friendly tap counter (BR-17) |
| BO3 | Access with no friction | 100% of tags open the right story on at least one iPhone and one Android at the venue before guests arrive; story readable within 3 s on 4G | Day-of checklist ([NFC-SETUP.md](NFC-SETUP.md)); automated performance budget in the PRD |
| BO4 | A lasting keepsake | Storybook online for at least 12 months; frames still work at home; a post-wedding chapter can be added | Spot check 1, 6 and 12 months after the wedding |
| BO5 | Low cost and low effort | About S$20–55 in materials (excluding frames and prints); S$0 hosting; guests install nothing; the couple only writes and picks photos | Budget in section 12 |
| BO6 | Respect privacy | No guest data collected; storybook hidden from search engines; every word and photo approved by the couple | Pre-launch checklist and sign-off |

## 5. Scope

**In scope**

- An online storybook of short stories (chapters), one per photo on the table, written by or
  with the couple. The sample storyline below has 8.
- One NFC tag per photo that opens that photo's story. Any tag (or the table-card QR code) opens
  the whole book on that phone.
- A QR code on a small table card for phones without NFC.
- A printable kit: tag sheet (which link goes on which tag), round tap-mark labels for the
  frames, and the table card.
- Hosting, a content-editing workflow for the couple, a pre-wedding test plan and a day-of
  runbook.
- Links out to a wishes form and a shared photo album, if the couple wants them.

**Out of scope for this release**

- A native app, guest accounts or logins, comments or likes, uploading photos into the site,
  livestreaming, gifts or payments.
- Designing and buying the physical decor beyond the tap marks and table card (frames, flowers
  and table styling stay with the couple or planner).
- A Chinese-language edition (planned as a later option, BR-15).

### Sample storyline

This is the working storyline. The couple can rename, reorder, add or drop chapters at any time
by editing one file; the tags keep working because each tag points to a frame number, not to a
fixed story.

| Frame | Chapter | The photo on the table | What the story covers |
|---|---|---|---|
| 1 | How we met | Earliest photo of the two of them, or of the place they met | Where and when their paths crossed, first impressions |
| 2 | Our first date | A photo from the first date, or the place it happened | Who asked whom, what happened, what each of them remembers |
| 3 | When we knew | A candid, everyday photo | The moment each of them knew the other was the one |
| 4 | Taiwan | Best photo from the Taiwan trip | Trip story, a favourite memory, something that went wrong |
| 5 | Iceland | Best photo from the Iceland trip | Trip story, a favourite memory, something that went wrong |
| 6 | New Zealand | Best photo from the New Zealand trip | Trip story, a favourite memory, something that went wrong |
| 7 | The proposal | The proposal photo | How it was planned, how it happened, the answer |
| 8 | The wedding shoot | Favourite frame from the pre-wedding shoot | Behind the scenes of the shoot, and a welcome to the guests |

Tags 1–8 sit on the frames in this order, so the table itself reads as a timeline from left to
right. Tag 0 is the QR code on the table card, which opens the overview of all chapters.

## 6. Stakeholders

| Stakeholder | Role | R | A | C | I |
|---|---|:-:|:-:|:-:|:-:|
| Huixin and Yongquan | Sponsors; own the story, photos and final approval | | ● | ● | |
| Organiser (the couple's friend) | Builds and configures the storybook, writes and tests the tags, runs the day-of setup | ● | | | |
| Wedding planner / venue coordinator | Table position, set-up time, power and Wi-Fi details | | | ● | ● |
| Photographer (if any) | Supplies pre-wedding and wedding photos | | | ● | ● |
| Helpers (bridal party, "table buddy") | Show guests how to tap; carry the spare-tag kit | ● (on the day) | | | ● |
| Guests | End users | | | | ● |

R = responsible, A = accountable, C = consulted, I = informed.

## 7. Who the guests are

| Persona | What they need |
|---|---|
| **The curious friend** (25–45, comfortable with phones) | Instant, delightful, worth sharing. Will tap several photos if the book rewards it. |
| **The relative who needs bigger text** (55+) | Plain instructions on the card, a larger-text option, a helper nearby. May not know what NFC is, and may prefer Chinese (later option). |
| **The plus-one** who barely knows the couple | A quick, warm introduction to who they are. Reads one or two stories. |
| **Kids and teens** | Tapping is fun. "Find all the photos" turns the table into a small treasure hunt. |
| **The guest without NFC** (older phone, NFC switched off) | The QR code on the table card gives the same experience. |
| **Family and friends who couldn't come** | After the wedding, the couple can share the link and open the book to everyone. |
| **The couple, later** | A keepsake that still works at home and can grow (e.g., a "The Big Day" chapter). |

## 8. Business requirements

Priority uses MoSCoW: **Must**, **Should**, **Could**, **Won't** (this release).

| ID | Requirement | Priority | Why |
|---|---|---|---|
| BR-01 | Each photo on the table has its own NFC tag, and tapping it opens **that photo's story** on the guest's phone, with nothing to install. | Must | Core idea; the request: "each NFC should lead to a specific story". |
| BR-02 | After tapping **any** tag, the guest can reach **every** story on their phone, with simple next/previous and an overview of all stories. | Must | The request: "all stories accessible once any NFC is tapped". |
| BR-03 | Guests without NFC get the same access through a QR code on the table card. | Must | Not every phone reads NFC, or has it switched on. |
| BR-04 | Works on the phones guests actually carry: recent iPhones and Android phones, in their default browsers. | Must | One wedding day, no second chances. |
| BR-05 | Loads fast on a patchy venue signal. | Must | Outdoor tables and crowded halls often have weak reception. |
| BR-06 | The couple can write and change stories and photos without touching code, and can change which story a tag opens **without rewriting the tag**. | Must | Content changes up to the last week; tags are locked after testing. |
| BR-07 | The table stays minimal: one small tap mark per photo and one table card. | Must | The decor brief: "engaging but less cluttered". |
| BR-08 | Privacy: no sign-up, no guest personal data, not listed in search engines, and the couple approves every word and photo. | Must | It is their personal story. |
| BR-09 | No recurring hosting cost and a small materials budget. | Must | A gift from a friend, not a vendor project. |
| BR-10 | Feels personal and celebratory: told in the couple's voices, beautiful on a phone, and visually tied to the physical photos. | Should | The difference between a link and a keepsake. |
| BR-11 | Encourages guests to explore the whole table, e.g. "photos found: 2 of 8". | Should | Drives engagement with the decor itself. |
| BR-12 | Easy for older guests: clear instructions, a larger-text option, a helper on the day. | Should | Important family audience. |
| BR-13 | "Tap to open": the book opens on a phone only after a tag tap or the table-card QR, and can be switched to open-to-all after the wedding. | Should | Light privacy plus a little magic; easy sharing later. |
| BR-14 | Optional links to leave the couple a wish and to share photos, using tools the couple already has (e.g., Google Form, shared album). | Should | Guest interaction without building a backend. |
| BR-15 | A Chinese-language edition for elder relatives. | Could | Depends on the guest list; doubles the writing. |
| BR-16 | Voice notes or short videos inside a story. | Could | Very personal; adds production effort and data use. |
| BR-17 | Anonymous tap counts per photo, collected without cookies. | Could | Lets the couple see what guests enjoyed; adds a third-party service. |
| BR-18 | A post-wedding chapter (e.g., "The Big Day") so the book becomes a keepsake. | Could | Extends the life of the frames at home. |
| BR-19 | Native app, accounts, comments/likes, uploads into the site, livestream, payments. | Won't | Cost and complexity far beyond the value for one day. |

## 9. Key decisions

| Decision | Choice | Reason |
|---|---|---|
| What the tag stores | A short, permanent link with a tag number, e.g. `…/bff-wedding/?t=3`. The website decides which story tag 3 opens. | Tags can be locked against tampering while the content stays editable. A spare or replacement tag can point to the same story. |
| How the book "opens" | The first tap on a phone opens (unlocks) the whole book on that phone and remembers it. | Meets BR-02 and BR-13 without accounts. |
| Where it lives | A static website on GitHub Pages from the `bff-wedding` repository. | Free, reliable, no server to maintain, easy to keep online for years. |
| Weak-signal plan | Small pages and photos; after the first tap the phone saves the whole book so it keeps working if the signal drops. | Venue reality (BR-05). |
| Fallback for no NFC | One QR code on the table card. | Covers every remaining phone (BR-03) without cluttering each frame. |
| Guest interaction | Links to a wishes form and a shared album instead of a custom backend. | Keeps cost and risk near zero (BR-09, BR-14). |

## 10. Assumptions, constraints and dependencies

**Assumptions**

- 8 photos on the table, one per chapter of the sample storyline. The book supports any number;
  more than 8 starts to crowd one table.
- Most guests carry NFC-capable phones (iPhone XS or newer reads tags with no app; most
  mid-range and premium Android phones have NFC). The rest use the QR code.
- The venue has at least patchy mobile data or guest Wi-Fi.
- The couple supplies digital photos and short texts (about 100–200 words per story) by the
  content deadline.
- English is the primary language.

**Constraints**

- **The repository is public.** Anything committed there (stories, photos) can be read on
  GitHub, whatever the website shows. If the couple wants the content private, make the
  repository private and host on a service that publishes private repositories for free
  (e.g., Cloudflare Pages or Netlify), or accept that it is public. Decide this before real
  photos are added (Open question Q6).
- **The tag link is permanent once tags are locked.** The website address (currently
  `https://sweetpotating.github.io/bff-wedding/`) must not change after that. Never rename the
  GitHub account or repository. A custom domain can be added later; GitHub forwards the old
  address to it.
- NFC tags don't work on or very close to metal (use on-metal tags if a frame is metal), and
  read at 1–4 cm.
- The wedding date is a fixed deadline.

**Dependencies**

- GitHub Pages availability; guests' phones and browsers.
- NFC sticker delivery (allow 1–2 weeks for online orders).
- Photo prints and printing of labels and the table card.
- Photos and texts from the couple (and the photographer, if any).

## 11. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| A guest's phone has no NFC or NFC is off | Medium | Medium | QR code on the table card; helper shows how; Android instructions on the card | Organiser |
| iPhone users miss the banner they must tap after reading the tag | Medium | Low | Card says "tap the banner that appears"; helper demonstrates | Organiser |
| Weak signal at the table | Medium | High | Light pages; book saved on the phone after the first tap; venue Wi-Fi name on the card if available | Organiser |
| A tag fails, peels off or gets damaged | Low | Medium | Two tags written per photo; spares in the day-of kit; test every tag on the day | Organiser / helper |
| Someone rewrites a tag as a prank | Low | High | Lock every tag after final testing | Organiser |
| Tags placed close together and the phone reads the neighbour | Medium | Low | Keep tags at least 8 cm apart; one tap mark per frame | Organiser |
| A metal frame blocks the tag | Medium | Medium | Use on-metal tags or put the tag on the label or stand, not the metal | Organiser |
| The website address changes after tags are locked | Low | High | Fix the address before writing tags; never rename the account or repo | Organiser |
| Stories aren't ready in time | Medium | High | Writing prompts ready from day one; content deadline at W-3 weeks; a check blocks launch while placeholder text remains | Couple / organiser |
| Content is more public than the couple wants | Medium | Medium | Decide repo visibility (Q6); "tap to open"; hidden from search engines; photo location data stripped | Couple |
| Older guests find it confusing | Medium | Medium | Large-text option, simple card instructions, helper at the table | Helpers |
| GitHub Pages outage on the day | Very low | High | Phones that tapped once keep the book offline; photos on the table still work as decor | — |

## 12. Budget estimate

Rough estimates in Singapore dollars, from typical online and photo-kiosk prices. Confirm when
ordering.

| Item | Qty | Est. cost |
|---|---|---|
| NFC stickers (NTAG213 or NTAG215, 25–30 mm, round) | 20–50 pack | S$8–25 |
| On-metal NFC tags (only if any frame is metal) | 10 pack | S$10–20 |
| Photo prints (e.g., 5R) | 8 | S$5–15 |
| Sticker paper for tap marks, card stock for the table card | 1 set | S$5–15 |
| Hosting (GitHub Pages) | – | S$0 |
| Custom domain (optional) | per year | S$15–25 |
| **Total (excluding frames and optional items)** | | **about S$20–55** |

Frames and table styling come from the couple's decor budget.

## 13. Timeline

The wedding date is not fixed in this document yet, so milestones are relative to the wedding
day (**W**).

| When | Milestone | Owner |
|---|---|---|
| W − 8 to 6 weeks | Couple reviews this BRD and the PRD; answers the open questions; confirms the storyline and picks one photo per chapter; NFC stickers ordered | Couple, organiser |
| W − 6 to 3 weeks | Couple writes the stories using the prompts in the starter content; organiser prepares photos and publishes the site; final website address confirmed | Couple, organiser |
| W − 3 weeks | **Content deadline.** Full review on real phones (iPhone and Android) | Couple |
| W − 2 weeks | Print photos, tap-mark labels and table card; write two tags per photo; test, then lock | Organiser |
| W − 1 week | Dry run on the real frames at the real table layout; the pre-launch check passes with no placeholder text; final publish | Organiser |
| W − 1 day | Confirm the site is live; pack the day-of kit (spare tags, tag sheet, a test phone) | Organiser |
| **W** | Set up the table at least 1 hour before guests arrive; test every tag on iPhone and Android; brief the helper | Organiser, helper |
| W + 1 to 4 weeks | Optional: add "The Big Day" chapter; switch the book to open-to-all and share the link | Couple, organiser |

## 14. Open questions for the couple

| # | Question | Default if no answer |
|---|---|---|
| Q1 | What is the wedding date and venue? Is the table outdoors, and is there guest Wi-Fi? | Date shown as a placeholder; assume mobile data only |
| Q2 | Is the sample storyline right? Which photo goes with each chapter? | The 8 chapters in section 5: how we met, first date, when we knew, Taiwan, Iceland, New Zealand, the proposal, the wedding shoot |
| Q3 | Who writes each story? One voice, or both ("Huixin says / Yongquan says")? | Both, with a short note from each |
| Q4 | Should elder relatives get a Chinese version? | English only for this release |
| Q5 | Should the book stay closed until a tap ("tap to open"), and be opened to everyone after the wedding? | Yes and yes |
| Q6 | Is it OK for the stories and photos to be publicly readable in the GitHub repository? | Ask before adding real photos; otherwise switch to a private repo and Cloudflare Pages or Netlify |
| Q7 | A wishes form and/or a shared guest photo album? | None until the links are provided |
| Q8 | Are any frames metal? Frame sizes? | Assume wood or acrylic; order a few on-metal tags anyway |
| Q9 | A custom web address (e.g., huixinandyongquan.com)? | No; use the free GitHub Pages address |
| Q10 | Is a helper available to stand near the table for the first hour? | Ask a member of the bridal party |

## 15. Sign-off

| Name | Role | Decision | Date |
|---|---|---|---|
| Huixin | Sponsor | ☐ Approved ☐ Changes needed | |
| Yongquan | Sponsor | ☐ Approved ☐ Changes needed | |
| Organiser | Project owner | ☐ Approved | |
