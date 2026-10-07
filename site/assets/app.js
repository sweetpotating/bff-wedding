/* The Storybook Table: Huixin & Yongquan.
 *
 * Every NFC tag on the reception table stores a link like  …/bff-wedding/?t=7
 * Opening it opens the whole book on this phone, marks tag 7's story as found,
 * rewrites the address to  …/bff-wedding/#the-proposal  and shows that story.
 *
 * Everything the guest reads comes from content/storybook.json. No dependencies.
 */
(function () {
  'use strict';

  var CONTENT_URL = 'content/storybook.json';
  var KEY = 'storybook:v1:';
  var RESERVED = ['cover', 'contact-sheet', 'thank-you'];
  var DRAFT = '✎';

  var bar = document.getElementById('bar');
  var main = document.getElementById('main');

  var book = null;
  var drafts = false;
  var memory = {};
  var pendingCircles = [];
  var developed = {};
  var offlineReady = false;
  var lastView = null;
  var resolveReady;
  var ready = new Promise(function (resolve) {
    resolveReady = resolve;
  });

  /* ---------- Saved state (this phone only) ---------- */

  function load(name, fallback) {
    try {
      var raw = window.localStorage.getItem(KEY + name);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      /* Storage blocked (private mode, settings) or unreadable: fall back to memory. */
    }
    return Object.prototype.hasOwnProperty.call(memory, name) ? memory[name] : fallback;
  }

  function save(name, value) {
    memory[name] = value;
    try {
      window.localStorage.setItem(KEY + name, JSON.stringify(value));
    } catch (e) {
      /* Kept in memory for this visit. */
    }
  }

  function forget() {
    memory = {};
    ['opened', 'found', 'large'].forEach(function (name) {
      try {
        window.localStorage.removeItem(KEY + name);
      } catch (e) {
        /* nothing saved */
      }
    });
  }

  /* ---------- Text helpers ---------- */

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isDraft(value) {
    return typeof value === 'string' && value.trim().charAt(0) === DRAFT;
  }

  /* Plain text without the draft mark, e.g. for alt text and the page title. */
  function plain(value) {
    var text = String(value == null ? '' : value).trim();
    return isDraft(text) ? text.slice(1).trim() : text;
  }

  /* Escaped inline text; *word* becomes italic. */
  function fmt(value) {
    return esc(plain(value)).replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  }

  function draftMark(value) {
    return isDraft(value) ? '<span class="draft-mark" aria-hidden="true">' + DRAFT + '</span>' : '';
  }

  function para(value, className) {
    var classes = [className || '', isDraft(value) ? 'draft' : ''].join(' ').trim();
    return '<p' + (classes ? ' class="' + classes + '"' : '') + '>' + draftMark(value) + fmt(value) + '</p>';
  }

  function safeUrl(value) {
    var url = String(value || '').trim();
    return /^https?:\/\//i.test(url) ? url : '';
  }

  function hasDrafts(node) {
    if (typeof node === 'string') return isDraft(node);
    if (Array.isArray(node)) return node.some(hasDrafts);
    if (node && typeof node === 'object') {
      return Object.keys(node).some(function (k) {
        return hasDrafts(node[k]);
      });
    }
    return false;
  }

  /* ---------- The book ---------- */

  function normalize(data) {
    var b = data && typeof data === 'object' ? data : {};
    var names = Array.isArray(b.names) && b.names.length >= 2 ? b.names.slice(0, 2) : ['Huixin', 'Yongquan'];
    var stories = (Array.isArray(b.stories) ? b.stories : []).filter(function (s) {
      return s && typeof s.id === 'string' && s.id && s.photo && s.photo.src;
    });
    stories.forEach(function (s) {
      s.id = s.id.toLowerCase();
      s.body = Array.isArray(s.body) ? s.body : s.body ? [String(s.body)] : [];
    });
    return {
      siteUrl: b.siteUrl || '',
      names: names,
      eyebrow: b.eyebrow || 'The story behind the photos',
      date: b.date || '',
      venue: b.venue || '',
      welcome: Array.isArray(b.welcome) ? b.welcome : [],
      closing: Array.isArray(b.closing) ? b.closing : [],
      gate: b.gate === 'open' ? 'open' : 'tap',
      links: b.links && typeof b.links === 'object' ? b.links : {},
      accent: b.accent || '',
      tags: b.tags && typeof b.tags === 'object' ? b.tags : {},
      stories: stories
    };
  }

  function coupleNames() {
    return plain(book.names[0]) + ' & ' + plain(book.names[1]);
  }

  function storyIndex(id) {
    var key = String(id || '').toLowerCase();
    for (var i = 0; i < book.stories.length; i++) {
      if (book.stories[i].id === key) return i;
    }
    return -1;
  }

  /* Stories that have a tag on the table (the denominator of "found"). */
  function taggedStoryIds() {
    var ids = [];
    Object.keys(book.tags).forEach(function (tag) {
      var target = String(book.tags[tag]).toLowerCase();
      if (storyIndex(target) >= 0 && ids.indexOf(target) < 0) ids.push(target);
    });
    return ids;
  }

  function foundIds() {
    var found = load('found', []);
    return Array.isArray(found)
      ? found.filter(function (id) {
          return storyIndex(id) >= 0;
        })
      : [];
  }

  function isOpen() {
    return book.gate === 'open' || load('opened', false) === true;
  }

  /* ---------- Tag entry ---------- */

  /* Handle a tap on tag `tagId`. Returns the route to show. */
  function tap(tagId) {
    var id = String(tagId == null ? '' : tagId).trim().toLowerCase();
    save('opened', true);
    var target = Object.prototype.hasOwnProperty.call(book.tags, id) ? String(book.tags[id]).toLowerCase() : null;
    if (target === null) {
      console.warn('Storybook: tag "' + id + '" is not in the tag map, so it opens the contact sheet.');
      return 'contact-sheet';
    }
    if (storyIndex(target) >= 0) {
      var found = foundIds();
      if (found.indexOf(target) < 0) {
        found.push(target);
        save('found', found);
        pendingCircles.push(target);
      }
      return target;
    }
    if (RESERVED.indexOf(target) >= 0) return target;
    console.warn('Storybook: tag "' + id + '" points to "' + target + '", which is not a story.');
    return 'contact-sheet';
  }

  function tagFromAddress() {
    try {
      return new URLSearchParams(window.location.search).get('t');
    } catch (e) {
      var m = /[?&]t=([^&#]*)/.exec(window.location.search);
      return m ? decodeURIComponent(m[1]) : null;
    }
  }

  /* Swap ?t=7 for #story-id without adding a history entry. */
  function replaceAddress(target) {
    var hash = target === 'cover' ? '' : '#' + target;
    try {
      window.history.replaceState(null, '', window.location.pathname + hash);
    } catch (e) {
      if (hash) window.location.hash = hash;
    }
  }

  function go(target) {
    if (window.location.hash.replace(/^#/, '') === target || (!window.location.hash && target === 'cover')) {
      route();
    } else {
      window.location.hash = target;
    }
  }

  /* ---------- Routing ---------- */

  function currentToken() {
    var raw = window.location.hash.replace(/^#/, '');
    try {
      raw = decodeURIComponent(raw);
    } catch (e) {
      /* keep the raw token */
    }
    return raw.trim().toLowerCase();
  }

  function route() {
    if (!book) return;
    if (!isOpen()) return show('closed', viewClosed());
    var token = currentToken();
    if (token === 'contact-sheet') return show('sheet', viewSheet());
    if (token === 'thank-you') return show('end', viewEnd());
    var i = token && token !== 'cover' ? storyIndex(token) : -1;
    if (i >= 0) return show('story:' + book.stories[i].id, viewStory(i));
    return show('cover', viewCover());
  }

  function show(key, view) {
    var sameView = key === lastView;
    lastView = key;
    document.title = view.title ? view.title + ' · ' + coupleNames() : coupleNames();
    bar.innerHTML = viewBar(key);
    main.innerHTML = (drafts ? ribbon() : '') + view.html;
    main.setAttribute('data-view', key.split(':')[0]);
    wire(main, key);
    if (!sameView) {
      window.scrollTo(0, 0);
      var heading = main.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        try {
          heading.focus({ preventScroll: true });
        } catch (e) {
          heading.focus();
        }
      }
    }
  }

  /* ---------- Shared pieces ---------- */

  var ICONS = {
    grid:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="4" width="7" height="7"/><rect x="13.5" y="4" width="7" height="7"/><rect x="3.5" y="14" width="7" height="7"/><rect x="13.5" y="14" width="7" height="7"/></g></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    out:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6m0-6-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    play:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    saved:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 3.5h14v17l-7-4.5-7 4.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m8.5 9.5 2.5 2.5 4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
  };

  var CIRCLE =
    '<svg class="circle" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path pathLength="1" d="M57 4C83 6 97 31 96 63C95 97 78 121 49 121C20 121 4 96 4 62C4 28 23 5 52 5C63 5 72 9 79 15"/></svg>';

  var PICTOGRAM =
    '<svg class="pictogram" viewBox="0 -10 300 170" aria-hidden="true" focusable="false">' +
    '<rect class="p-frame" x="14" y="12" width="150" height="128" rx="2"/>' +
    '<rect class="p-photo" x="26" y="24" width="126" height="88"/>' +
    '<circle class="p-mark" cx="146" cy="126" r="9"/>' +
    '<path class="p-wave" d="M150.1 110.5A16 16 0 0 1 161.9 127.4M153.7 102.2A25 25 0 0 1 171.0 126.9"/>' +
    '<g transform="translate(214 128) rotate(-146)">' +
    '<rect class="p-phone" x="0" y="0" width="62" height="118" rx="11"/>' +
    '<rect class="p-screen" x="7" y="14" width="48" height="94" rx="3"/>' +
    '<rect class="p-slot" x="23" y="6" width="16" height="3" rx="1.5"/></g>' +
    '</svg>';

  function band(left, mid, right) {
    return (
      '<div class="band" aria-hidden="true"><span>' +
      esc(left) +
      '</span><span class="band-mid">' +
      esc(mid) +
      '</span><span>' +
      esc(right) +
      '</span></div>'
    );
  }

  function ribbon() {
    return '<p class="ribbon" role="note"><b>Draft</b> · text marked ' + DRAFT + ' is still to be written</p>';
  }

  function initial(name) {
    return esc(plain(name).charAt(0).toUpperCase());
  }

  function viewBar(key) {
    var large = document.documentElement.classList.contains('large');
    var html =
      '<a class="monogram" href="#cover" aria-label="Cover: ' +
      esc(coupleNames()) +
      '">' +
      initial(book.names[0]) +
      '<span aria-hidden="true">&amp;</span>' +
      initial(book.names[1]) +
      '</a><div class="bar-actions">';
    if (isOpen()) {
      html +=
        '<a class="bar-btn" href="#contact-sheet"' +
        (key === 'sheet' ? ' aria-current="page"' : '') +
        '>' +
        ICONS.grid +
        '<span>All frames</span></a>';
    }
    html +=
      '<button type="button" class="bar-btn text-size" data-action="text-size" aria-pressed="' +
      large +
      '" aria-label="Larger text">Aa</button></div>';
    return html;
  }

  function img(src, alt, extra) {
    return (
      '<img src="' +
      esc(src) +
      '" alt="' +
      esc(plain(alt)) +
      '"' +
      (extra || '') +
      '>'
    );
  }

  function linksHtml() {
    var wishes = safeUrl(book.links.wishes);
    var album = safeUrl(book.links.album);
    if (!wishes && !album) return '';
    var html = '<div class="links">';
    if (wishes) {
      html +=
        '<a class="btn" href="' +
        esc(wishes) +
        '" target="_blank" rel="noopener">Leave ' +
        esc(coupleNames()) +
        ' a wish' +
        ICONS.out +
        '</a>';
    }
    if (album) {
      html +=
        '<a class="btn" href="' + esc(album) + '" target="_blank" rel="noopener">Share your photos from today' + ICONS.out + '</a>';
    }
    return html + '</div>';
  }

  function roll(exposed) {
    var items = book.stories
      .map(function (s, i) {
        var inner = exposed
          ? img(s.photo.src, '', ' loading="lazy" decoding="async" data-pos="' + esc(s.photo.position || '') + '"')
          : '<span class="blank"></span>';
        return '<li>' + inner + '<span class="n">' + (i + 1) + '</span></li>';
      })
      .join('');
    return '<ul class="roll" aria-hidden="true" data-frames="' + book.stories.length + '">' + items + '</ul>';
  }

  function namesHeading() {
    return (
      '<h1 class="names"><span class="n">' +
      fmt(book.names[0]) +
      '</span> <span class="n"><span class="amp">&amp;</span> ' +
      fmt(book.names[1]) +
      '</span></h1>'
    );
  }

  /* ---------- Views ---------- */

  function viewClosed() {
    var html =
      band('▸ 00', coupleNames(), '▸ 00A') +
      '<div class="page cover closed">' +
      '<p class="eyebrow">' +
      fmt(book.eyebrow) +
      '</p>' +
      namesHeading() +
      roll(false) +
      '<p class="closed-msg">This storybook opens when you tap a photo on the reception table.</p>' +
      PICTOGRAM +
      '<ul class="how">' +
      '<li><p><strong>iPhone:</strong> hold the top of your phone to the round mark beside a photo, then tap the banner that appears.</p></li>' +
      '<li><p><strong>Android:</strong> make sure NFC is on, then hold the middle of your phone’s back to the mark.</p></li>' +
      '<li><p><strong>No NFC?</strong> Scan the code on the table card with your camera.</p></li>' +
      '</ul></div>';
    return { title: '', html: html };
  }

  function whenLine() {
    var parts = [book.date, book.venue].filter(function (v) {
      return v && String(v).trim();
    });
    if (!parts.length) return '';
    if (parts.some(isDraft)) {
      return parts
        .map(function (v) {
          return para(v, 'when');
        })
        .join('');
    }
    return '<p class="when">' + parts.map(fmt).join(' · ') + '</p>';
  }

  function viewCover() {
    var n = book.stories.length;
    var first = book.stories[0];
    var html =
      band('▸ 00', coupleNames(), '▸ 00A') +
      '<div class="page cover">' +
      '<p class="eyebrow">' +
      fmt(book.eyebrow) +
      '</p>' +
      namesHeading() +
      whenLine() +
      roll(true) +
      '<div class="prose">' +
      book.welcome.map(function (p) {
        return para(p);
      }).join('') +
      '</div>' +
      '<div class="actions">' +
      (first ? '<a class="btn primary" href="#' + esc(first.id) + '">Start with frame 1' + ICONS.arrow + '</a>' : '') +
      '<a class="btn" href="#contact-sheet">See all ' +
      n +
      ' frames</a></div>' +
      linksHtml() +
      '</div>';
    return { title: '', html: html };
  }

  function voicesHtml(s) {
    var voices = (Array.isArray(s.voices) ? s.voices : []).filter(function (v) {
      return v && v.text;
    });
    if (!voices.length) return '';
    return (
      '<section class="voices" aria-labelledby="voices-label"><p class="label" id="voices-label">In their words</p><div class="voices-list">' +
      voices
        .map(function (v) {
          return (
            '<figure class="voice' +
            (isDraft(v.text) ? ' draft' : '') +
            '"><blockquote><p>' +
            draftMark(v.text) +
            fmt(v.text) +
            '</p></blockquote><figcaption>' +
            fmt(v.name) +
            '</figcaption></figure>'
          );
        })
        .join('') +
      '</div></section>'
    );
  }

  function galleryHtml(s) {
    var photos = (Array.isArray(s.gallery) ? s.gallery : [])
      .filter(function (g) {
        return g && g.src;
      })
      .slice(0, 6);
    if (!photos.length) return '';
    return (
      '<section class="gallery" aria-labelledby="gallery-label"><p class="label" id="gallery-label">More photos</p>' +
      '<ul class="strip" tabindex="0" aria-label="More photos, scroll sideways">' +
      photos
        .map(function (g) {
          return (
            '<li><figure>' +
            img(g.src, g.alt, ' loading="lazy" decoding="async"') +
            (g.caption
              ? '<figcaption' + (isDraft(g.caption) ? ' class="draft"' : '') + '>' + draftMark(g.caption) + fmt(g.caption) + '</figcaption>'
              : '') +
            '</figure></li>'
          );
        })
        .join('') +
      '</ul></section>'
    );
  }

  function mediaHtml(s) {
    var html = '';
    if (s.audio && s.audio.src) {
      html +=
        '<figure class="voice-note"><figcaption class="label">' +
        fmt(s.audio.label || 'Voice note') +
        '</figcaption><audio controls preload="none" src="' +
        esc(s.audio.src) +
        '"></audio></figure>';
    }
    var video = s.video ? safeUrl(s.video.url) : '';
    if (video) {
      html +=
        '<a class="btn" href="' +
        esc(video) +
        '" target="_blank" rel="noopener">' +
        ICONS.play +
        fmt(s.video.label || 'Watch the video') +
        '</a>';
    }
    return html ? '<div class="media">' + html + '</div>' : '';
  }

  function viewStory(i) {
    var s = book.stories[i];
    var n = book.stories.length;
    var num = i + 1;
    var found = foundIds().indexOf(s.id) >= 0;
    var prev = i === 0
      ? { href: 'cover', dir: 'Cover', title: coupleNames() }
      : { href: book.stories[i - 1].id, dir: 'Frame ' + i, title: plain(book.stories[i - 1].title) };
    var next = i === n - 1
      ? { href: 'thank-you', dir: 'The end', title: 'Thank you' }
      : { href: book.stories[i + 1].id, dir: 'Frame ' + (i + 2), title: plain(book.stories[i + 1].title) };

    var html =
      band('▸ ' + num, coupleNames(), '▸ ' + num + 'A') +
      '<div class="page story"><article>' +
      '<p class="frame-no">Frame ' +
      num +
      ' of ' +
      n +
      '</p>' +
      (s.kicker ? para(s.kicker, 'kicker') : '') +
      '<h1 class="title">' +
      fmt(s.title) +
      '</h1>' +
      (s.caption ? para(s.caption, 'caption') : '') +
      '<figure class="print"><div class="frame-img">' +
      img(s.photo.src, s.photo.alt, ' class="main-photo" decoding="async" fetchpriority="high" data-pos="' + esc(s.photo.position || '') + '"') +
      '</div><p class="print-no" aria-hidden="true">' +
      num +
      'A</p>' +
      (found ? '<p class="found-note">found at the table ✓</p>' : '') +
      '</figure>' +
      '<div class="prose">' +
      s.body.map(function (p) {
        return para(p);
      }).join('') +
      '</div>' +
      voicesHtml(s) +
      galleryHtml(s) +
      mediaHtml(s) +
      '</article>' +
      '<nav class="pager" aria-label="Frames">' +
      '<a class="prev" rel="prev" href="#' +
      esc(prev.href) +
      '"><span class="dir"><span aria-hidden="true">← </span>' +
      esc(prev.dir) +
      '</span><span class="t">' +
      esc(prev.title) +
      '</span></a>' +
      '<a class="next" rel="next" href="#' +
      esc(next.href) +
      '"><span class="dir">' +
      esc(next.dir) +
      '<span aria-hidden="true"> →</span></span><span class="t">' +
      esc(next.title) +
      '</span></a>' +
      '</nav>' +
      '<p class="all-frames"><a class="btn" href="#contact-sheet">' +
      ICONS.grid +
      'See all ' +
      n +
      ' frames</a></p>' +
      '</div>';
    return { title: plain(s.title), html: html };
  }

  function viewSheet() {
    var n = book.stories.length;
    var tagged = taggedStoryIds();
    var found = foundIds().filter(function (id) {
      return tagged.indexOf(id) >= 0;
    });
    var animate = pendingCircles.slice();
    pendingCircles = [];

    var progress = '';
    if (tagged.length) {
      progress =
        '<p class="progress">Photos found at the table: <strong>' + found.length + ' of ' + tagged.length + '</strong></p>';
      if (found.length === tagged.length) {
        progress +=
          '<div class="complete"><p class="hand">You found all ' +
          tagged.length +
          '!</p><p>Thank you for reading our story.</p></div>';
      } else if (found.length === 0) {
        progress += '<p class="hint">Tap the round marks beside the photos on the table. Each photo you find gets circled here.</p>';
      } else {
        progress += '<p class="hint">Find the rest on the table. Each one gets circled here.</p>';
      }
    }

    var items = book.stories
      .map(function (s, i) {
        var isFound = found.indexOf(s.id) >= 0;
        var classes = (isFound ? 'found' : '') + (isFound && animate.indexOf(s.id) >= 0 ? ' just-found' : '');
        return (
          '<li' +
          (classes ? ' class="' + classes.trim() + '"' : '') +
          '><a href="#' +
          esc(s.id) +
          '"><span class="shot-wrap"><span class="shot">' +
          img(s.photo.src, '', ' loading="lazy" decoding="async" data-pos="' + esc(s.photo.position || '') + '"') +
          '</span>' +
          (isFound ? CIRCLE : '') +
          '</span><span class="meta"><span class="num" aria-hidden="true">' +
          (i + 1) +
          '</span><span class="name"><span class="sr-only">Frame ' +
          (i + 1) +
          ': </span>' +
          fmt(s.title) +
          (isFound ? '<span class="sr-only"> (found at the table)</span>' : '') +
          '</span></span></a></li>'
        );
      })
      .join('');

    var html =
      band('▸ 1', 'Contact sheet', '▸ ' + n + 'A') +
      '<div class="page wide sheet-page">' +
      '<p class="eyebrow">Contact sheet</p>' +
      '<h1 class="title">All ' +
      n +
      ' frames</h1>' +
      progress +
      '<ol class="sheet">' +
      items +
      '</ol>' +
      '<p class="saved" data-saved' +
      (offlineReady ? '' : ' hidden') +
      '>' +
      ICONS.saved +
      'Saved on this phone. Works without signal.</p>' +
      linksHtml() +
      '</div>';
    return { title: 'All frames', html: html };
  }

  function viewEnd() {
    var n = book.stories.length;
    var last = book.stories[n - 1];
    var first = book.stories[0];
    var html =
      band('▸ ' + n + 'A', coupleNames(), 'END') +
      '<div class="page end">' +
      '<p class="eyebrow">From both of us</p>' +
      '<h1 class="title">Thank you</h1>' +
      '<div class="prose">' +
      book.closing.map(function (p) {
        return para(p);
      }).join('') +
      '</div>' +
      '<p class="caption signature">' +
      fmt(book.names[0]) +
      ' <span class="amp">&amp;</span> ' +
      fmt(book.names[1]) +
      '</p>' +
      linksHtml() +
      '<div class="actions">' +
      '<a class="btn primary" href="#contact-sheet">' +
      ICONS.grid +
      'See all ' +
      n +
      ' frames</a>' +
      (first ? '<a class="btn" href="#' + esc(first.id) + '">Back to frame 1</a>' : '') +
      '</div>' +
      (last
        ? '<nav class="pager" aria-label="Frames"><a class="prev" rel="prev" href="#' +
          esc(last.id) +
          '"><span class="dir"><span aria-hidden="true">← </span>Frame ' +
          n +
          '</span><span class="t">' +
          esc(plain(last.title)) +
          '</span></a></nav>'
        : '') +
      '</div>';
    return { title: 'Thank you', html: html };
  }

  function viewError() {
    bar.innerHTML = '';
    main.innerHTML =
      '<div class="page error"><h1 tabindex="-1">The storybook didn’t load</h1>' +
      '<p>Check your signal or Wi-Fi, then try again.</p>' +
      '<div class="actions"><button type="button" class="btn primary" data-action="retry">Try again</button></div></div>';
  }

  /* ---------- After render ---------- */

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function onImageError(event) {
    var image = event.target;
    var box = document.createElement('span');
    box.className = 'img-missing';
    box.textContent = navigator.onLine === false ? 'This photo appears when you’re back online.' : 'Photo unavailable right now.';
    if (image.alt) box.setAttribute('aria-label', image.alt);
    if (image.parentNode) image.parentNode.replaceChild(box, image);
  }

  function wire(root, key) {
    Array.prototype.forEach.call(root.querySelectorAll('img'), function (image) {
      var pos = image.getAttribute('data-pos');
      if (pos) image.style.objectPosition = pos;
      image.addEventListener('error', onImageError);
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-frames]'), function (el) {
      el.style.setProperty('--frames', el.getAttribute('data-frames'));
    });
    var photo = root.querySelector('img.main-photo');
    if (photo && !reducedMotion() && !developed[key]) {
      developed[key] = true;
      var start = function () {
        photo.classList.add('develop');
      };
      if (photo.complete && photo.naturalWidth) start();
      else photo.addEventListener('load', start);
    }
  }

  function updateSavedNote() {
    var note = main.querySelector('[data-saved]');
    if (note) note.hidden = !offlineReady;
  }

  /* ---------- Controls ---------- */

  function applyTextSize() {
    document.documentElement.classList.toggle('large', load('large', false) === true);
  }

  function applyAccent() {
    var accent = String(book.accent || '').trim();
    if (accent && window.CSS && CSS.supports && CSS.supports('color', accent)) {
      document.documentElement.style.setProperty('--pencil', accent);
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('[data-action]') : null;
    if (!target) return;
    var action = target.getAttribute('data-action');
    if (action === 'text-size') {
      save('large', !document.documentElement.classList.contains('large'));
      applyTextSize();
      target.setAttribute('aria-pressed', String(document.documentElement.classList.contains('large')));
    } else if (action === 'retry') {
      window.location.reload();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var el = event.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|AUDIO|VIDEO)$/.test(el.tagName))) return;
    if (el && el.closest && el.closest('.strip')) return;
    var link = main.querySelector(event.key === 'ArrowLeft' ? '.pager .prev' : '.pager .next');
    if (!link) return;
    event.preventDefault();
    go(link.getAttribute('href').replace(/^#/, ''));
  });

  /* ---------- Offline saving ---------- */

  function photosToSave() {
    return book.stories.map(function (s) {
      return new URL(s.photo.src, document.baseURI).href;
    });
  }

  function registerWorker() {
    if (window.STORYBOOK_NO_SW || !('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    navigator.serviceWorker.onmessage = function (event) {
      if (event.data && event.data.type === 'saved' && event.data.complete) {
        offlineReady = true;
        document.documentElement.setAttribute('data-offline-ready', String(event.data.saved));
        updateSavedNote();
      }
    };
    navigator.serviceWorker
      .register('sw.js')
      .then(function () {
        return navigator.serviceWorker.ready;
      })
      .then(function (registration) {
        if (registration.active) registration.active.postMessage({ type: 'save', urls: photosToSave() });
      })
      .catch(function (error) {
        console.warn('Storybook: offline saving is not available here.', error);
      });
  }

  /* ---------- Start ---------- */

  function start(data) {
    book = normalize(data);
    drafts = hasDrafts(data);
    applyAccent();
    var tag = tagFromAddress();
    if (tag !== null) replaceAddress(tap(tag));
    route();
    window.addEventListener('hashchange', route);
    resolveReady();
    registerWorker();
  }

  applyTextSize();

  /* For the print kit's "open as if tapped" links, previews and tests. */
  window.storybook = {
    ready: ready,
    tap: function (tagId) {
      return ready.then(function () {
        var target = tap(tagId);
        go(target);
        return target;
      });
    },
    reset: function () {
      return ready.then(function () {
        forget();
        pendingCircles = [];
        developed = {};
        applyTextSize();
        lastView = null;
        go('cover');
      });
    },
    state: function () {
      return book
        ? { opened: isOpen(), found: foundIds(), large: load('large', false) === true, offlineReady: offlineReady }
        : null;
    }
  };

  fetch(CONTENT_URL, { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + CONTENT_URL);
      return response.json();
    })
    .then(start)
    .catch(function (error) {
      console.error('Storybook: could not load the content file.', error);
      viewError();
    });
})();
