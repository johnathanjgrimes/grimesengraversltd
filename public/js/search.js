// Site search: the header search button opens a box that searches awards, pages and common questions.
// The index (/search-index.json) loads the first time search is opened. Without JavaScript the button
// is a plain link to the award catalogue.
(function () {
  var box = document.getElementById('site-search');
  var opener = document.querySelector('[data-search-open]');
  if (!box || !opener || typeof box.showModal !== 'function') return;
  var input = box.querySelector('[data-search-input]');
  var out = box.querySelector('[data-search-results]');
  var index = null, loading = null, active = -1, timer;
  var STOP = { a: 1, an: 1, the: 1, for: 1, of: 1, and: 1, to: 1, do: 1, you: 1, i: 1, can: 1, my: 1, with: 1, in: 1, on: 1, is: 1, me: 1, we: 1, our: 1, how: 1, what: 1, does: 1, it: 1 };
  // Words people use that mean something we stock under another name.
  var SAME = { trophy: 'award', trophies: 'awards', plack: 'plaque', plaques: 'plaque', cymraeg: 'welsh', price: 'prices', cost: 'price', deliver: 'delivery', postage: 'delivery', shipping: 'delivery' };

  function ph(event, props) { if (window.posthog && posthog.capture) posthog.capture(event, props); }
  function words(s) { return (s || '').toLowerCase().replace(/[^a-z0-9.ŵŷâêîôû]+/g, ' ').trim().split(' ').filter(Boolean); }
  function terms(q) {
    return words(q).filter(function (w) { return !STOP[w]; }).map(function (w) { return SAME[w] || w; });
  }
  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) loading = fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (list) {
      index = list.map(function (it) { return { it: it, name: words(it.name), key: words(it.k), desc: words(it.desc) }; });
      return index;
    });
    return loading;
  }

  // Same forgiving match as the catalogue: prefix, part of a word (3+ letters) or one typo (5+ letters).
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
  function match(list, term) {
    var best = 0;
    for (var w = 0; w < list.length; w++) {
      var word = list[w];
      if (word === term) return 3;
      if (word.indexOf(term) === 0) best = Math.max(best, 2);
      else if (term.length >= 3 && word.indexOf(term) > 0) best = Math.max(best, 1);
      else if (term.length >= 5 && typo1(term, word.slice(0, term.length + 1))) best = Math.max(best, 0.6);
    }
    return best;
  }
  // The title counts most, then keywords, then the description. Normally every word must match;
  // "loose" (used when that finds nothing, e.g. a typed-out question) needs most of them.
  function score(e, ts, loose) {
    var total = 0, missed = 0;
    for (var t = 0; t < ts.length; t++) {
      var s = Math.max(match(e.name, ts[t]) * 2, match(e.key, ts[t]) * 1.5, match(e.desc, ts[t]) * 0.5);
      if (!s && (!loose || ++missed > Math.floor(ts.length / 2))) return 0;
      total += s;
    }
    return total;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function row(it) {
    var img = it.img ? '<img src="' + esc(it.img) + '" alt="" width="56" height="56" loading="lazy">' : '<span class="ss-icon" aria-hidden="true">' + (it.t === 'faq' ? '?' : '→') + '</span>';
    return '<li><a href="' + esc(it.url) + '" class="ss-item">' + img + '<span><strong>' + esc(it.name) + '</strong><small>' + esc(it.desc) + '</small></span></a></li>';
  }
  function group(title, list) { return list.length ? '<p class="ss-head">' + title + '</p><ul>' + list.map(row).join('') + '</ul>' : ''; }

  function render() {
    var q = input.value.trim(), ts = terms(q);
    active = -1;
    if (!ts.length) {
      out.innerHTML = '<p class="ss-hint">Try “star award”, “long service”, “brass plaque”, “Welsh wording” or an award code.</p>';
      return;
    }
    var find = function (loose) {
      return index.map(function (e) { return { it: e.it, s: score(e, ts, loose) }; }).filter(function (h) { return h.s > 0; });
    };
    var hits = find(false);
    if (!hits.length && ts.length > 1) hits = find(true);
    hits.sort(function (a, b) { return b.s - a.s; });
    var of = function (t) { return hits.filter(function (h) { return h.it.t === t; }); };
    var awards = of('award'), pages = of('page'), faqs = of('faq');
    var awardsHtml = group('Awards', awards.slice(0, 6).map(function (h) { return h.it; }));
    if (awards.length > 6) awardsHtml += '<p class="ss-more"><a href="/glass-awards/?q=' + encodeURIComponent(q) + '">See all ' + awards.length + ' matching awards →</a></p>';
    var pagesHtml = group('Pages', pages.slice(0, 4).map(function (h) { return h.it; }));
    var faqHtml = group('Questions', faqs.slice(0, 3).map(function (h) { return h.it; }));
    // Show whichever kind matches best first.
    var pagesFirst = pages.length && (!awards.length || pages[0].s >= awards[0].s);
    var html = pagesFirst ? pagesHtml + awardsHtml + faqHtml : awardsHtml + pagesHtml + faqHtml;
    out.innerHTML = html || '<p class="ss-hint">Nothing found for “' + esc(q) + '”. Try the <a href="/award-finder/">award finder</a>, or email us at <a href="mailto:info@grimesengravers.com">info@grimesengravers.com</a> and we’ll help.</p>';
    clearTimeout(timer);
    timer = setTimeout(function () { ph('site_search', { q: q, results: hits.length }); }, 1200);
  }

  function open(e) {
    if (e) e.preventDefault();
    box.showModal();
    input.focus();
    input.select();
    load().then(render).catch(function () { out.innerHTML = '<p class="ss-hint">Search isn’t available right now. <a href="/glass-awards/">Browse all awards</a>.</p>'; });
  }
  opener.addEventListener('click', open);
  input.addEventListener('input', function () { if (index) render(); });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('[data-search-close]')) box.close(); });
  // Arrow keys move through the results; Enter opens the highlighted one (or the first).
  input.addEventListener('keydown', function (e) {
    var links = out.querySelectorAll('a.ss-item');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!links.length) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach(function (a, i) { a.classList.toggle('on', i === active); });
      links[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      var go = links[active] || links[0];
      if (go) { e.preventDefault(); location.href = go.href; }
    }
  });
  // Press "/" to search, except on the catalogue, which has its own search box.
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !document.getElementById('aw-q') && !/input|textarea|select/i.test(document.activeElement.tagName) && !box.open) open(e);
  });
})();
