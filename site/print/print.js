/* Print kit: tag sheet, tap-mark labels and table card, built from content/storybook.json.
 * Uses qrcode-generator (MIT, Kazuhiko Arase), loaded as ../assets/vendor/qrcode.js.
 */
(function () {
  'use strict';

  var kit = document.getElementById('kit');
  var NTAG213_BYTES = 144;
  var URI_PREFIXES = ['', 'http://www.', 'https://www.', 'http://', 'https://'];
  var STORY_RESERVED = { 'contact-sheet': 'Contact sheet (all frames)', cover: 'Cover', 'thank-you': 'Thank-you page' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plain(value) {
    var text = String(value == null ? '' : value).trim();
    return text.charAt(0) === '✎' ? text.slice(1).trim() : text;
  }

  function utf8Length(text) {
    return new TextEncoder().encode(text).length;
  }

  /* Bytes an NDEF message with one URI record takes on the tag, including the TLV wrapper. */
  function ndefBytes(url) {
    var code = 0;
    for (var i = 1; i < URI_PREFIXES.length; i++) {
      if (url.indexOf(URI_PREFIXES[i]) === 0 && URI_PREFIXES[i].length > URI_PREFIXES[code].length) code = i;
    }
    var payload = 1 + utf8Length(url.slice(URI_PREFIXES[code].length));
    var record = 3 + (payload < 256 ? 1 : 4) + payload;
    return (record < 255 ? 2 : 4) + record + 1;
  }

  function tagLink(siteUrl, tagId) {
    return siteUrl + '?t=' + encodeURIComponent(tagId);
  }

  function qrSvg(text, label) {
    var qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    var count = qr.getModuleCount();
    var quiet = 4;
    var size = count + quiet * 2;
    var path = '';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
    }
    return (
      '<svg class="qr" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="' +
      esc(label || 'QR code for ' + text) +
      '" data-qr="' + esc(text) + '"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' +
      path +
      '" fill="#000"/></svg>'
    );
  }

  function ruler() {
    var ticks = '';
    for (var mm = 0; mm <= 50; mm += 5) {
      ticks += '<line x1="' + mm + '" y1="0" x2="' + mm + '" y2="' + (mm % 10 === 0 ? 3 : 2) + '"/>';
    }
    return (
      '<div class="ruler"><svg viewBox="-0.5 -0.5 51 4" aria-hidden="true"><g stroke="#1f1c1a" stroke-width="0.25">' +
      '<line x1="0" y1="0" x2="50" y2="0"/>' +
      ticks +
      '</g></svg><span>This line should measure exactly 50 mm. If not, print again at 100% scale.</span></div>'
    );
  }

  function arcs(cx, cy, radii, from, to) {
    return radii
      .map(function (r) {
        var a0 = (from * Math.PI) / 180;
        var a1 = (to * Math.PI) / 180;
        return (
          'M' + (cx + r * Math.cos(a0)).toFixed(2) + ' ' + (cy + r * Math.sin(a0)).toFixed(2) +
          'A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * Math.cos(a1)).toFixed(2) + ' ' + (cy + r * Math.sin(a1)).toFixed(2)
        );
      })
      .join('');
  }

  /* A 30 mm round tap mark to print on sticker paper and place over the NFC sticker. */
  function tapMark(label, monogram) {
    return (
      '<svg class="mark" viewBox="0 0 100 100" role="img" aria-label="Tap mark for frame ' + esc(label) + '">' +
      '<circle cx="50" cy="50" r="48.5" class="m-cut"/>' +
      '<circle cx="50" cy="50" r="45" class="m-ring"/>' +
      '<text x="50" y="27" class="m-tap">TAP</text>' +
      '<text x="45" y="66" class="m-num">' + esc(label) + '</text>' +
      '<path class="m-wave" d="' + arcs(45, 55, [17, 24], -40, 40) + '"/>' +
      '<text x="50" y="84" class="m-mono">' + esc(monogram) + '</text>' +
      '</svg>'
    );
  }

  function render(book) {
    var siteUrl = String(book.siteUrl || '');
    if (!/^https:\/\/.+\/$/.test(siteUrl)) {
      kit.innerHTML = '<p class="kit-error">siteUrl in content/storybook.json must start with https:// and end with /.</p>';
      return;
    }
    var names = (book.names || ['Huixin', 'Yongquan']).map(plain);
    var monogram = names[0].charAt(0) + ' & ' + names[1].charAt(0);
    var stories = Array.isArray(book.stories) ? book.stories : [];
    var titleOf = {};
    stories.forEach(function (s, i) {
      titleOf[String(s.id).toLowerCase()] = 'Frame ' + (i + 1) + ': ' + plain(s.title);
    });
    var tags = book.tags || {};
    var ids = Object.keys(tags).sort(function (a, b) {
      var na = Number(a);
      var nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a < b ? -1 : a > b ? 1 : 0;
    });

    /* 1. Tag sheet */
    var rows = ids
      .map(function (id) {
        var target = String(tags[id]).toLowerCase();
        var link = tagLink(siteUrl, id);
        var bytes = ndefBytes(link);
        var fits = bytes <= NTAG213_BYTES;
        var where = target === 'contact-sheet' ? 'Table card QR code (no NFC sticker needed)' : 'NFC sticker on the frame, plus 1 spare';
        return (
          '<tr data-tag="' + esc(id) + '">' +
          '<td class="c-tag">' + esc(id) + '</td>' +
          '<td><strong>' + esc(titleOf[target] || STORY_RESERVED[target] || 'Unknown: ' + target) + '</strong><br><span class="muted">' + esc(where) + '</span></td>' +
          '<td class="c-link"><a href="../?t=' + encodeURIComponent(id) + '" title="Open as if this tag was tapped">' + esc(link) + '</a>' +
          '<br><span class="' + (fits ? 'muted' : 'warn') + '">' + bytes + ' of ' + NTAG213_BYTES + ' bytes on an NTAG213' + (fits ? '' : ': too long') + '</span></td>' +
          '<td class="c-qr">' + qrSvg(link, 'QR code for tag ' + id) + '</td>' +
          '<td class="c-check"><span>☐ Written</span><span>☐ iPhone</span><span>☐ Android</span><span>☐ Locked</span></td>' +
          '</tr>'
        );
      })
      .join('');

    var tagSheet =
      '<section class="sheet-page" id="tag-sheet" aria-labelledby="tag-sheet-h">' +
      '<p class="eyebrow">' + esc(names.join(' & ')) + ' · sheet 1</p>' +
      '<h2 id="tag-sheet-h">Tag sheet</h2>' +
      '<ol class="steps">' +
      '<li>In the free <strong>NFC Tools</strong> app: <em>Write → Add a record → URL/URI</em>, enter the link, tap <em>Write</em> and hold a sticker to the phone. Write each frame’s link on two stickers (one is the spare).</li>' +
      '<li>Read each sticker back with an iPhone and an Android phone. It must open the story in the “Opens” column.</li>' +
      '<li>Only after the venue rehearsal: <em>Other → Lock tag</em>. Locking is permanent.</li>' +
      '</ol>' +
      '<table class="tags"><thead><tr><th>Tag</th><th>Opens</th><th>Link to write</th><th>QR</th><th>Done</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      ruler() +
      '</section>';

    /* 2. Tap marks: two per frame (one spare). */
    var frameIds = ids.filter(function (id) {
      return titleOf[String(tags[id]).toLowerCase()];
    });
    var marks = '';
    frameIds.forEach(function (id) {
      marks += '<li>' + tapMark(id, monogram) + '<span>' + esc(id) + '</span></li>';
      marks += '<li>' + tapMark(id, monogram) + '<span>' + esc(id) + ' spare</span></li>';
    });
    var tapMarks =
      '<section class="sheet-page" id="tap-marks" aria-labelledby="tap-marks-h">' +
      '<p class="eyebrow">' + esc(names.join(' & ')) + ' · sheet 2</p>' +
      '<h2 id="tap-marks-h">Tap marks</h2>' +
      '<p>30 mm round labels. Print on white sticker paper and cut along the outer circle, or use 30 mm round label sheets. ' +
      'Stick each mark directly over its NFC sticker on the frame, so guests see the mark and not the chip. Keep marks at least 8 cm apart.</p>' +
      '<ul class="marks">' + marks + '</ul>' +
      ruler() +
      '</section>';

    /* 3. Table card (4R size). */
    var cardLink = tagLink(siteUrl, ids.filter(function (id) {
      return String(tags[id]).toLowerCase() === 'contact-sheet';
    })[0] || '0');
    var card =
      '<article class="card">' +
      '<div class="card-band"><span>▸ 00</span><span>' + esc(names.join(' & ').toUpperCase()) + '</span><span>▸ 00A</span></div>' +
      '<div class="card-body">' +
      '<p class="card-eyebrow">' + esc(plain(book.eyebrow) || 'The story behind the photos') + '</p>' +
      '<p class="card-names">' + esc(names[0]) + ' <span>&amp;</span> ' + esc(names[1]) + '</p>' +
      '<p class="card-lead">Every photo on this table has a story. Tap your phone on the round mark beside any photo to read it.</p>' +
      '<p class="card-how"><strong>iPhone:</strong> hold the top of your phone to the mark, then tap the banner that appears.</p>' +
      '<p class="card-how"><strong>Android:</strong> make sure NFC is on, then hold the middle of your phone’s back to the mark.</p>' +
      '<div class="card-qr">' + qrSvg(cardLink, 'QR code that opens the storybook') + '<p><strong>No NFC?</strong><br>Scan this code with your camera.</p></div>' +
      '<p class="card-foot">Thick cases or card wallets can block the tap.</p>' +
      '</div><div class="card-band"><span>▸ 1</span><span>' + esc(String(stories.length)) + ' FRAMES · TAP ANY ONE</span><span>▸ ' + esc(String(stories.length)) + 'A</span></div></article>';
    var tableCard =
      '<section class="sheet-page" id="table-card" aria-labelledby="table-card-h">' +
      '<p class="eyebrow">' + esc(names.join(' & ')) + ' · sheet 3</p>' +
      '<h2 id="table-card-h">Table card</h2>' +
      '<p>4 × 6 in (102 × 152 mm), the size of a 4R photo frame or acrylic sign stand. Cut along the dashed line, and print this sheet twice if you want a spare. ' +
      'The QR code opens the overview of all frames (' + esc(cardLink) + ').</p>' +
      '<div class="cards">' + card + '</div>' +
      ruler() +
      '</section>';

    kit.innerHTML = tagSheet + tapMarks + tableCard;
    document.documentElement.setAttribute('data-ready', '');
  }

  document.getElementById('print-button').addEventListener('click', function () {
    window.print();
  });

  fetch('../content/storybook.json', { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(render)
    .catch(function (error) {
      kit.innerHTML = '<p class="kit-error">Could not read content/storybook.json: ' + esc(error.message) + '</p>';
    });
})();
