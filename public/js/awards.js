// Glass awards: catalogue search/filter/sort, award-page view event, and the quote form, which lists
// the awards in the quote basket (see basket.js) with quantities, a remove button and wording per award.
(function () {
  var ph = function (event, props) { if (window.posthog) window.posthog.capture(event, props || {}); };
  var Q = window.GrimesQuote;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- Catalogue ----------
  var grid = document.getElementById('aw-grid');
  if (grid) catalogue();

  function catalogue() {
    var cards = Array.prototype.slice.call(grid.children);
    var PAGE = parseInt(grid.dataset.page, 10) || 48;
    var q = document.getElementById('aw-q');
    var sort = document.getElementById('aw-sort');
    var price = document.getElementById('aw-price');
    var stock = document.getElementById('aw-stock');
    var count = document.getElementById('aw-count');
    var empty = document.getElementById('aw-empty');
    var more = document.getElementById('aw-more');
    var range = '', limit = PAGE, searchTimer;
    var items = cards.map(function (li) {
      return { el: li, range: li.dataset.range, price: parseFloat(li.dataset.price), order: +li.dataset.order, stock: li.dataset.stock === 'true',
        name: li.dataset.name, words: li.dataset.search.replace(/[^a-z0-9.]+/g, ' ').trim().split(' ') };
    });

    // Forgiving match: each query word must match a word in the award by prefix, by containing it
    // (3+ letters), or with one typo (5+ letters). Exact and prefix matches score higher.
    function typo1(a, b) {
      if (Math.abs(a.length - b.length) > 1) return false;
      var i = 0, j = 0, edits = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++edits > 1) return false;
        if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
      }
      return edits + (a.length - i) + (b.length - j) <= 1;
    }
    function score(item, terms) {
      var total = 0;
      for (var t = 0; t < terms.length; t++) {
        var term = terms[t], best = 0;
        for (var w = 0; w < item.words.length; w++) {
          var word = item.words[w];
          if (word === term) { best = 3; break; }
          if (word.indexOf(term) === 0) best = Math.max(best, 2);
          else if (term.length >= 3 && word.indexOf(term) > 0) best = Math.max(best, 1);
          else if (term.length >= 5 && typo1(term, word.slice(0, term.length + 1)) ) best = Math.max(best, 0.6);
        }
        if (!best) return 0;
        total += best;
      }
      return total;
    }

    function apply(resetLimit) {
      if (resetLimit) limit = PAGE;
      var terms = q.value.toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim().split(' ').filter(Boolean);
      var band = price.value.split('-'), lo = parseFloat(band[0]) || 0, hi = band[1] ? parseFloat(band[1]) : Infinity;
      var shown = items.filter(function (it) {
        it.score = terms.length ? score(it, terms) : 1;
        return it.score > 0 && (!range || it.range === range) && (!price.value || (it.price >= lo && it.price < hi)) && (!stock.checked || it.stock);
      });
      var by = sort.value;
      shown.sort(function (a, b) {
        if (by === 'price-asc') return a.price - b.price;
        if (by === 'price-desc') return b.price - a.price;
        if (by === 'name') return a.name.localeCompare(b.name);
        return (b.score - a.score) || (a.order - b.order);
      });
      items.forEach(function (it) { it.el.hidden = true; });
      shown.forEach(function (it, i) { it.el.hidden = i >= limit; grid.appendChild(it.el); });
      var n = shown.length;
      count.textContent = (n === items.length && !terms.length) ? n + ' awards'
        : n + (n === 1 ? ' award' : ' awards') + (terms.length ? ' matching “' + q.value.trim() + '”' : '');
      empty.hidden = n > 0;
      more.hidden = n <= limit;
      more.textContent = 'Show more awards (' + (n - Math.min(n, limit)) + ' more)';
      // Keep the search in the address so it can be shared or bookmarked.
      var params = new URLSearchParams();
      if (q.value.trim()) params.set('q', q.value.trim());
      if (range) params.set('range', range);
      if (price.value) params.set('price', price.value);
      if (stock.checked) params.set('stock', '1');
      if (by !== 'best') params.set('sort', by);
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''));
    }

    function setRange(r) {
      range = r;
      document.querySelectorAll('button[data-range]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.range === r)); });
    }

    // Start from any search in the address.
    var p = new URLSearchParams(location.search);
    if (p.get('q')) q.value = p.get('q');
    if (p.get('range')) setRange(p.get('range'));
    if (p.get('price')) price.value = p.get('price');
    if (p.get('stock')) stock.checked = true;
    if (p.get('sort')) sort.value = p.get('sort');

    q.addEventListener('input', function () {
      apply(true);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { if (q.value.trim()) ph('award_search', { q: q.value.trim(), results: items.filter(function (i) { return !i.el.hidden; }).length }); }, 1200);
    });
    q.addEventListener('keydown', function (e) { if (e.key === 'Escape') { q.value = ''; apply(true); } });
    // Press "/" anywhere to jump to search.
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    });
    [sort, price, stock].forEach(function (el) { el.addEventListener('change', function () { apply(true); }); });
    document.querySelectorAll('button[data-range]').forEach(function (b) {
      b.addEventListener('click', function () { setRange(b.dataset.range); apply(true); ph('award_range_filtered', { range: range || 'All' }); });
    });
    more.addEventListener('click', function () { limit += PAGE; apply(false); });
    apply(false);
  }

  // ---------- Award page ----------
  var view = document.querySelector('[data-award-view]');
  if (view) ph('award_viewed', { sku: view.dataset.awardView });

  // ---------- Quote form ----------
  var form = document.getElementById('quote-form');
  if (!form || !Q) return;
  var MIN = parseInt(form.dataset.min, 10) || Q.MIN;
  var MAX_BOXES = 60;
  var linesEl = document.getElementById('q-lines');
  var emptyEl = document.getElementById('q-empty');
  var approx = document.getElementById('approx_quantity');
  var totalEl = document.getElementById('qty-total');
  var namesBox = document.getElementById('names-box');
  var groups = document.getElementById('names-groups');
  var namesPaste = document.getElementById('names-paste');
  var pasteInput = document.getElementById('names-paste-input');
  var namesHint = document.getElementById('names-hint');
  var wordingLabel = form.querySelector('[data-wording-label]');
  var wordingFit = form.querySelector('[data-wording-fit]');
  var FIELDS = ['engraving', 'wording_type', 'wording', 'needed_by', 'occasion', 'name', 'email', 'notes', 'approx_quantity', 'logo_file'];
  var ignoreFit = form.querySelector('[data-ignore-fit]');
  var fitOff = function () { return ignoreFit.checked; };
  var different = function () { var r = form.querySelector('[name="wording_type"]:checked'); return r && r.value !== 'Same on every award'; };

  function suggestion(l) {
    if (fitOff()) return '';
    return l.fitChars && l.fitLines ? 'Fits roughly ' + l.fitChars + ' characters a line, up to ' + l.fitLines + (l.fitLines === 1 ? ' line' : ' lines') : '';
  }

  // Your awards: photo, details, quantity and remove.
  function renderLines() {
    var d = Q.get();
    emptyEl.hidden = d.lines.length > 0;
    approx.required = !d.lines.length;
    linesEl.innerHTML = d.lines.map(function (l) {
      return '<li class="q-line" data-sku="' + esc(l.sku) + '">' +
        '<img src="' + esc(l.image) + '" alt="" width="80" height="80" class="q-line-img">' +
        '<div class="min-w-0 flex-1"><a href="' + esc(l.url) + '" class="font-bold text-ink no-underline">' + esc(l.name) + '</a>' +
        '<p class="muted m-0 text-sm">' + esc(l.sku) + (l.size ? ' · ' + esc(l.size) : '') + (l.area ? ' · engraving area ' + esc(l.area) : '') + (l.price ? ' · ' + esc(l.price) : '') + '</p><p class="m-0 text-sm" data-line-stock>' + stockText(l) + '</p></div>' +
        '<div class="flex items-center gap-3"><label class="flex items-center gap-2 font-semibold">How many? <input type="number" min="1" inputmode="numeric" class="inp" style="width: 5.5rem" data-line-qty value="' + esc(l.qty) + '"></label>' +
        '<button type="button" class="q-remove" data-line-remove aria-label="Remove ' + esc(l.name) + '">Remove</button></div></li>';
    }).join('');
    renderNames();
    update();
    d.lines.forEach(function (l) {
      Q.checkStock(l.src).then(function (j) {
        if (!j) return;
        if (j.in_stock !== l.stock) { Q.setStock(l.sku, j.in_stock); return; }
        update();
      });
    });
  }

  // Live stock against the quantity wanted. short: fewer in stock than they've asked for.
  function stockState(l) {
    var j = Q.stockFor(l), want = parseInt(l.qty, 10) || 0;
    if (!j) return null;
    return { j: j, want: want, short: !j.in_stock || (j.qty != null && want > j.qty) };
  }
  function stockText(l) {
    var s = stockState(l);
    if (s && !s.j.in_stock) return '<strong style="color: #8A1C1C">Sold out at the moment:</strong> <span class="muted">keep it and we’ll suggest the closest match, or remove it.</span>';
    if (s && s.short) return '<strong style="color: #8A1C1C">Only ' + s.j.qty + ' in stock, you’ve asked for ' + s.want + '.</strong> <span class="muted">Lower the number, or keep it and we’ll check with our supplier.</span>';
    if (s) return '<span style="color: #166534">✓ ' + Q.stockLabel(s.j) + '</span>';
    if (l.src && document.documentElement.dataset.stockCheck) return '<span class="muted">Checking stock…</span>';
    return l.stock === false ? '<strong>Currently out of stock</strong>' : '';
  }
  // One line above the Send button so the stock check is visible without scrolling back up.
  function paintStockSummary(d) {
    var el = document.getElementById('stock-summary');
    if (!el) return;
    var withSrc = d.lines.filter(function (l) { return l.src; });
    if (!withSrc.length || !document.documentElement.dataset.stockCheck) { el.hidden = true; return; }
    var states = withSrc.map(stockState), done = states.filter(Boolean), short = done.filter(function (s) { return s.short; });
    el.hidden = false;
    if (done.length < withSrc.length) { el.style.color = ''; el.textContent = 'Checking stock with our supplier…'; return; }
    el.style.color = short.length ? '#8A1C1C' : '#166534';
    el.innerHTML = short.length ? '<strong>' + (short.length === 1 ? '1 award is' : short.length + ' awards are') + ' short of stock for the numbers you’ve asked for.</strong> See “Your awards” above. You can still send.'
      : '<strong>✓ Everything is in stock for the numbers you’ve asked for.</strong> <span class="muted">Checked live with our supplier, and again when you send.</span>';
  }
  function paintStock(d) {
    paintStockSummary(d);
    linesEl.querySelectorAll('.q-line').forEach(function (li) {
      var l = d.lines.filter(function (x) { return x.sku === li.dataset.sku; })[0];
      var el = li.querySelector('[data-line-stock]');
      if (l && el) el.innerHTML = stockText(l);
    });
  }
  // For the emailed summary.
  function stockTag(l) {
    var s = stockState(l);
    if (!s) return '';
    if (!s.j.in_stock) return ' [SOLD OUT when sent]';
    if (s.short) return ' [ONLY ' + s.j.qty + ' IN STOCK when sent]';
    return ' [' + Q.stockLabel(s.j).toLowerCase() + ' when sent]';
  }

  // Final check when they press Send: a fresh count for every award. If any are short, explain once and
  // let them change the numbers or press Send again to go ahead.
  // Logo upload (shown for "Logo and text"): the file goes to our Cloudflare worker and the form sends
  // its download link, as Web3Forms' free plan doesn't take files.
  var logoBox = document.getElementById('logo-box'), logoInput = document.getElementById('logo-input');
  var logoStatus = document.getElementById('logo-status'), logoUrl = form.querySelector('[data-logo-url]');
  var STOCK = document.documentElement.dataset.stockCheck, uploading = null;
  function showLogo() {
    var r = form.querySelector('[name="engraving"]:checked');
    // Off until the worker's FILES store is set up (logoUploads in src/data/config.json).
    logoBox.hidden = !STOCK || !document.documentElement.dataset.logoUploads || !r || r.value !== 'Logo and text';
    if (logoUrl.value && !logoStatus.textContent) logoDone(decodeURIComponent(logoUrl.value.split('/').pop()));
  }
  function logoDone(name) {
    logoStatus.style.color = '#166534';
    logoStatus.innerHTML = '<strong>✓ ' + esc(name) + ' uploaded.</strong> <button type="button" class="font-semibold" style="background: none; border: none; padding: 0; color: #8A1C1C; cursor: pointer; text-decoration: underline" data-logo-remove>Remove</button>';
  }
  function logoError(msg) { logoStatus.style.color = '#8A1C1C'; logoStatus.textContent = msg; logoInput.value = ''; }
  logoInput.addEventListener('change', function () {
    var f = logoInput.files[0];
    if (!f) return;
    if (!/\.(pdf|ai|eps|svg|png|jpe?g)$/i.test(f.name)) return logoError('Please use a PDF, AI, EPS, SVG, PNG or JPG file.');
    if (f.size > 10 * 1024 * 1024) return logoError('That file is over 10 MB. Reply to our email with it instead, or send a smaller version.');
    logoStatus.style.color = ''; logoStatus.textContent = 'Uploading ' + f.name + '…';
    var body = new FormData(); body.append('file', f);
    uploading = fetch(STOCK + '/upload', { method: 'POST', body: body })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || 'failed'); return j; }); })
      .then(function (j) { logoUrl.value = j.url; persistFields(); logoDone(j.name); logoInput.value = ''; ph('logo_uploaded', { size: j.size }); })
      .catch(function () { logoError('Sorry, that didn’t upload. Try again, or reply to our email with the file.'); })
      .then(function () { uploading = null; });
  });
  logoStatus.addEventListener('click', function (e) {
    if (!e.target.closest('[data-logo-remove]')) return;
    logoUrl.value = ''; logoStatus.textContent = ''; persistFields();
  });

  var stockOk = '';
  function checkBeforeSend() {
    // Wait for a logo that's still uploading, so its link goes with the form.
    if (uploading) { var btn0 = form.querySelector('[type="submit"]'); btn0.textContent = 'Uploading logo…'; return uploading.then(function () { btn0.textContent = 'Send my quote request'; return checkBeforeSend(); }); }
    update();
    var d = Q.get(), btn = form.querySelector('[type="submit"]'), warn = document.getElementById('stock-warn');
    var withSrc = d.lines.filter(function (l) { return l.src; });
    if (!withSrc.length || !document.documentElement.dataset.stockCheck) return true;
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Checking stock…';
    var timeout = new Promise(function (r) { setTimeout(r, 8000); });
    return Promise.race([Promise.all(withSrc.map(function (l) { return Q.checkStock(l.src, true); })), timeout]).then(function () {
      btn.disabled = false; btn.textContent = label;
      d = Q.get(); paintStock(d); update();
      var short = d.lines.filter(function (l) { var s = stockState(l); return s && s.short; });
      if (!short.length) { warn.hidden = true; return true; }
      // Same shortfall as the warning they've already seen: they've chosen to go ahead.
      var sig = short.map(function (l) { return l.sku + ':' + l.qty + ':' + stockState(l).j.qty; }).join('|');
      if (sig === stockOk) return true;
      stockOk = sig;
      warn.innerHTML = '<p class="m-0 mb-2 font-bold">Stock has changed for ' + (short.length === 1 ? 'one award' : short.length + ' awards') + '</p><ul class="m-0 mb-2 pl-5">' +
        short.map(function (l) { var s = stockState(l); return '<li>' + esc(l.name) + ': you’ve asked for ' + s.want + ', ' + (s.j.in_stock ? 'only ' + s.j.qty + ' in stock' : 'sold out') + '</li>'; }).join('') +
        '</ul><p class="m-0">Change the numbers above, or press <strong>Send anyway</strong> and we’ll check with our supplier or suggest the closest match in your quote.</p>';
      warn.hidden = false;
      btn.textContent = 'Send anyway';
      if (warn.scrollIntoView) warn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ph('stock_short_at_send', { awards: short.map(function (l) { return l.sku; }).join(',') });
      return false;
    });
  }

  // Different wording on each: one group per award type, a numbered box per award.
  function renderNames() {
    var d = Q.get(), on = different();
    namesBox.hidden = !on;
    wordingLabel.textContent = on ? 'Wording that’s the same on every award (optional)' : 'Wording';
    var lines = d.lines;
    var same = lines.length === 1 ? suggestion(lines[0]) : '';
    wordingFit.textContent = !on && same ? same + ' on this award. A suggestion only: we’ll check it fits on your proof.' : '';
    if (!on) return;
    var names = d.names || {};
    var units = lines.reduce(function (s, l) { return s + (parseInt(l.qty, 10) || 0); }, 0);
    var tooMany = units > MAX_BOXES;
    namesPaste.hidden = !tooMany;
    groups.hidden = tooMany;
    namesHint.textContent = !lines.length ? 'Add awards above to get a box for each one.'
      : tooMany ? 'That’s a big order, so paste the wording below instead of filling in ' + units + ' boxes.'
      : fitOff() ? 'One box per award, usually the winner’s name. We’ll fit the wording to each award and show you on the proof.'
      : 'One box per award, usually the winner’s name. The size guide is a suggestion: we’ll check it fits on your proof.';
    if (tooMany) return;
    var focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.nameKey : null;
    groups.innerHTML = lines.map(function (l) {
      var qty = parseInt(l.qty, 10) || 0, boxes = '';
      for (var k = 1; k <= qty; k++) {
        var key = l.sku + '-' + k, id = 'nm-' + key.replace(/[^a-z0-9-]/gi, '');
        boxes += '<li class="field"><label for="' + id + '">Award ' + k + '</label>' +
          '<textarea id="' + id + '" rows="2" class="inp" style="resize: vertical" data-name-key="' + esc(key) + '" data-fit-chars="' + (l.fitChars || '') + '" data-fit-lines="' + (l.fitLines || '') + '" placeholder="e.g. Jane Smith, Top Sales 2026">' + esc(names[key] || '') + '</textarea>' +
          '<span class="name-fit text-sm" aria-live="polite"></span></li>';
      }
      return '<div class="names-group"><div class="names-group-head"><img src="' + esc(l.image) + '" alt="" width="56" height="56">' +
        '<div><p class="m-0 font-bold">' + esc(l.name) + '</p><p class="muted m-0 text-sm">' + qty + (qty === 1 ? ' award' : ' awards') + (suggestion(l) ? ' · ' + suggestion(l) : '') + '</p></div></div>' +
        (qty ? '<ol class="names-grid">' + boxes + '</ol>' : '<p class="muted m-0">Set a quantity above.</p>') + '</div>';
    }).join('');
    groups.querySelectorAll('textarea[data-name-key]').forEach(checkFit);
    if (focusKey) { var f = groups.querySelector('[data-name-key="' + focusKey + '"]'); if (f) f.focus(); }
  }

  // Live size guide: never blocks, just turns amber when the wording is likely too long.
  function checkFit(t) {
    var per = parseInt(t.dataset.fitChars, 10), max = parseInt(t.dataset.fitLines, 10), out = t.nextElementSibling;
    if (!per || !max || fitOff()) { out.textContent = ''; out.className = 'name-fit text-sm'; return; }
    var rows = t.value.split('\n'), longest = rows.reduce(function (m, r) { return Math.max(m, r.trim().length); }, 0);
    var over = longest > per || rows.length > max;
    out.textContent = t.value.trim() ? (over ? 'Might be tight: ' : '') + longest + ' of about ' + per + ' characters on the longest line, ' + rows.length + ' of up to ' + max + (max === 1 ? ' line' : ' lines') : 'Up to about ' + per + ' characters a line, ' + max + (max === 1 ? ' line' : ' lines');
    out.className = 'name-fit text-sm' + (over ? ' over' : '');
  }

  function namesText(d) {
    if (!different()) return '';
    if (!namesPaste.hidden) return pasteInput.value.trim();
    var names = d.names || {}, out = [];
    d.lines.forEach(function (l) {
      var qty = parseInt(l.qty, 10) || 0;
      if (!qty) return;
      out.push(l.name + ' (' + l.sku + '):');
      for (var k = 1; k <= qty; k++) out.push('  ' + k + '. ' + ((names[l.sku + '-' + k] || '').replace(/\n+/g, ' / ').trim() || '(to follow)'));
    });
    return out.join('\n');
  }

  function update() {
    var d = Q.get(), total = Q.total(d), n = d.lines.length;
    var firstQty = linesEl.querySelector('[data-line-qty]');
    var short = n && total < MIN;
    if (firstQty) firstQty.setCustomValidity(short ? 'Our minimum order is ' + MIN + ' awards in total.' : '');
    totalEl.innerHTML = n ? total + ' awards' + (short ? ' (minimum ' + MIN + ')' : '') + ' · <strong>Total from ' + Q.gbp(Q.money(d)) + '</strong><span class="block text-xs">' + Q.TOTAL_NOTE + '</span>' : 'Minimum order ' + MIN + ' awards in total.';
    totalEl.style.color = short ? '#8A1C1C' : '';
    paintStock(d);
    var parts = d.lines.map(function (l) {
      return (l.qty || '?') + ' × ' + l.name + ' (' + l.sku + ')' + (Q.unit(l) ? ' @ ' + Q.gbp(Q.unit(l)) : '') + stockTag(l);
    });
    form.querySelector('[data-summary]').value = (parts.length ? parts.join('\n') + '\nEstimated total from ' + Q.gbp(Q.money(d)) + ' (' + Q.TOTAL_NOTE.toLowerCase() + ')' : '') || (approx.value ? 'Recommendation wanted, about ' + approx.value + ' awards' : '');
    form.querySelector('[data-subject]').value = 'Glass award quote: ' + (parts.map(function (p) { return p.replace(/ \[.*\]$/, ''); }).join(', ') || 'recommendation request');
    form.querySelector('[data-names]').value = namesText(d);
  }

  // Remember the rest of the form too, so leaving to browse more awards loses nothing.
  function persistFields() {
    var d = Q.get();
    d.fields = d.fields || {};
    FIELDS.forEach(function (f) {
      var el = form.querySelector('[name="' + f + '"]:checked') || form.querySelector('[name="' + f + '"]:not([type="radio"])');
      if (el) d.fields[f] = el.value;
    });
    d.paste = pasteInput.value;
    d.fields.ignore_size_guide = ignoreFit.checked;
    Q.save(d, true);
  }
  function restoreFields() {
    var d = Q.get(), f = d.fields || {};
    FIELDS.forEach(function (name) {
      if (f[name] == null) return;
      var radio = form.querySelector('[name="' + name + '"][type="radio"][value="' + String(f[name]).replace(/"/g, '\\"') + '"]');
      if (radio) radio.checked = true;
      else { var el = form.querySelector('[name="' + name + '"]'); if (el && el.type !== 'radio') el.value = f[name]; }
    });
    pasteInput.value = d.paste || '';
    ignoreFit.checked = !!f.ignore_size_guide;
    if (d.lines.length) document.querySelector('[data-browse-more]').textContent = '← Browse more awards (your quote is saved)';
  }

  linesEl.addEventListener('input', function (e) {
    if (!e.target.matches('[data-line-qty]')) return;
    var sku = e.target.closest('[data-sku]').dataset.sku, v = parseInt(e.target.value, 10);
    if (v > 0) { Q.setQty(sku, v); renderNames(); update(); }
  });
  linesEl.addEventListener('click', function (e) {
    var r = e.target.closest('[data-line-remove]');
    if (r) { Q.remove(r.closest('[data-sku]').dataset.sku); renderLines(); }
  });
  groups.addEventListener('input', function (e) {
    var key = e.target.dataset.nameKey; if (!key) return;
    var d = Q.get(); d.names = d.names || {}; d.names[key] = e.target.value; Q.save(d, true);
    checkFit(e.target); update();
  });
  pasteInput.addEventListener('input', function () { persistFields(); update(); });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'wording_type' || e.target === ignoreFit) { renderNames(); update(); }
    if (e.target.name === 'engraving') showLogo();
    if (e.target === ignoreFit) ph('size_guide_toggled', { off: ignoreFit.checked });
    persistFields();
  });
  form.addEventListener('input', function (e) { if (FIELDS.indexOf(e.target.name) > -1) { persistFields(); update(); } });
  // The panel or another tab changed the basket.
  Q.onChange(function () { if (!document.activeElement || !document.activeElement.matches('[data-line-qty], [data-name-key]')) renderLines(); });

  var started = false;
  form.addEventListener('input', function () { if (!started) { started = true; ph('quote_started', { awards: Q.get().lines.length }); } });
  form.onBeforeSend = checkBeforeSend;
  form.onSent = function () { Q.clear(); logoUrl.value = ''; logoStatus.textContent = ''; showLogo(); renderLines(); document.querySelector('[data-browse-more]').textContent = '← Browse more awards'; };

  // A ?award=CODE link adds that award (looked up in /awards-index.json), then tidies the address.
  var wanted = new URLSearchParams(location.search).get('award');
  restoreFields();
  showLogo();
  renderLines();
  if (Q.get().lines.some(function (l) { return !l.src; })) {
    fetch('/awards-index.json').then(function (r) { return r.json(); }).then(function (idx) {
      var d = Q.get(), changed = false;
      d.lines.forEach(function (l) { if (!l.src && idx[l.sku] && idx[l.sku].src) { l.src = idx[l.sku].src; changed = true; } });
      if (changed) { Q.save(d, true); renderLines(); }
    }).catch(function () {});
  }
  if (wanted && !Q.has(wanted)) {
    fetch('/awards-index.json').then(function (r) { return r.json(); }).then(function (idx) {
      if (idx[wanted]) { Q.add(idx[wanted]); renderLines(); }
    }).catch(function () {});
  }
  if (wanted) history.replaceState(null, '', location.pathname);
})();
