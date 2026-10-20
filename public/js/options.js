/* Suggested options and "share with your team".
   A link like /quote/?options=<code> opens the order page with one or more ready-made options
   (e.g. Option 1, 2, 3), each with its awards, quantities and an estimate. The customer can
   choose one (it loads into their order to change as they like) or ask us to quote them all.
   The code is base64url JSON: { for: "Joshua", note: "…", o: [ { n: "Crystal Diamond", l: [["SY1091", 14], ["SY1092", 14]] } ] }.
   The same format is used by the "Share this order with your team" button. */
(function () {
  var ENG = 10.50, SETUP = 40.00, BULK = 20;
  var gbp = function (n) { return '\u00a3' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ph = function (ev, props) { try { window.posthog && window.posthog.capture(ev, props || {}); } catch (e) {} };

  function encode(obj) {
    var s = unescape(encodeURIComponent(JSON.stringify(obj)));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(code) {
    try {
      var b = code.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  }
  window.GrimesOptions = { encode: encode, decode: decode };

  var params = new URLSearchParams(location.search);
  var code = params.get('options');
  var data = code ? decode(code) : null;
  // Conversion tracking: each link carries a short reference (r), never personal details.
  // It's remembered in this browser so the final order (even days later) is tagged with the link and option chosen.
  var META_KEY = 'grimes-options-meta';
  function getMeta() { try { var m = JSON.parse(localStorage.getItem(META_KEY)); return m && Date.now() - (m.t || 0) < 60 * 24 * 3600 * 1000 ? m : null; } catch (e) { return null; } }
  function setMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
  if (data) { var prev = getMeta() || {}; setMeta({ ref: data.r || 'untitled', options: (data.o || []).length, choice: prev.ref === (data.r || 'untitled') ? prev.choice : null, est: prev.ref === (data.r || 'untitled') ? prev.est : null, t: Date.now() }); }
  var meta = getMeta();
  function tagOrder() {
    meta = getMeta(); if (!meta) return;
    try { window.posthog && window.posthog.register({ options_ref: meta.ref, options_choice: meta.choice || 'none yet' }); } catch (e) {}
    var f = document.getElementById('suggested_options_field');
    if (f) f.value = meta.ref + (meta.choice ? ': ' + meta.choice : '') + (meta.est ? ' (est. ' + gbp(meta.est) + ')' : '');
  }
  ph = (function (base) { return function (ev, props) { props = props || {}; if (meta && !props.options_ref) props.options_ref = meta.ref; base(ev, props); }; })(ph);
  // Keep the customer's details out of the address bar (and so out of analytics) once read.
  if (code) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
  var box = document.getElementById('suggested-options');
  var idxPromise = null;
  function index() { return idxPromise || (idxPromise = fetch('/awards-index.json').then(function (r) { return r.json(); })); }

  function priceOf(item) { var u = Number(item && (item.unit != null ? item.unit : item.price)); return isFinite(u) ? u : 0; }

  function optionMaths(opt, idx) {
    var n = 0, awards = 0, rows = [];
    (opt.l || []).forEach(function (pair) {
      var sku = pair[0], q = Math.max(1, parseInt(pair[1], 10) || 1), it = idx[sku];
      if (!it) return;
      var u = priceOf(it); n += q; awards += u * q;
      rows.push({ sku: sku, q: q, u: u, it: it });
    });
    var total = n ? awards + ENG * n + SETUP : 0;
    return { n: n, awards: awards, eng: ENG * n, total: total, rows: rows };
  }

  function loadIntoOrder(opts, idx, note) {
    var Q = window.GrimesQuote; if (!Q) return;
    var d = Q.get(); d.lines = d.lines.filter(function (l) { return l.kind === 'plaque'; }); Q.save(d, true);
    opts.forEach(function (opt) {
      (opt.l || []).forEach(function (pair) {
        var it = idx[pair[0]]; if (!it) return;
        var item = {}; Object.keys(it).forEach(function (k) { item[k] = it[k]; });
        item.qty = Math.max(1, parseInt(pair[1], 10) || 1);
        if (Q.has(item.sku)) { var cur = Q.get(); cur.lines.forEach(function (l) { if (l.sku === item.sku) l.qty = (parseInt(l.qty, 10) || 0) + item.qty; }); Q.save(cur, true); }
        else Q.add(item);
      });
    });
    var notes = document.getElementById('notes');
    var d2 = Q.get(); d2.fields = d2.fields || {};
    // Prefill the customer's details from the link (only into empty fields, so nothing they typed is overwritten).
    var c = (data && data.c) || {};
    ['name', 'email', 'company', 'phone', 'needed_by', 'po_number', 'invoice_email'].forEach(function (k) {
      if (c[k] && !d2.fields[k]) d2.fields[k] = String(c[k]).slice(0, 200);
    });
    if (note) d2.fields.notes = note + (d2.fields.notes ? '\n\n' + d2.fields.notes : '');
    Q.save(d2, true);
    if (notes && note) notes.value = d2.fields.notes;
    // Go back to the plain order page so it draws the newly loaded order.
    setTimeout(function () { location.replace(location.pathname + '#q-awards-title'); }, 150);
  }

  function renderOptions(idx) {
    if (!box || !data || !data.o || !data.o.length) return;
    var opts = data.o.slice(0, 4);
    var cards = opts.map(function (opt, i) {
      var m = optionMaths(opt, idx);
      var lines = m.rows.map(function (r) {
        return '<li><span>' + esc(r.it.name) + ' <span class="so-q">' + r.q + ' \u00d7 ' + gbp(r.u) + '</span></span><span>' + gbp(r.u * r.q) + '</span></li>';
      }).join('');
      var img = m.rows[0] && m.rows[0].it.image ? '<img src="' + esc(m.rows[0].it.image) + '" alt="" loading="lazy" class="so-img">' : '';
      return '<article class="so-card">' +
        '<div class="so-head">' + img + '<div><p class="so-label">Option ' + (i + 1) + '</p><h3 class="so-name">' + esc(opt.n || ('Option ' + (i + 1))) + '</h3></div></div>' +
        (opt.d ? '<p class="so-desc">' + esc(opt.d) + '</p>' : '') +
        '<ul class="so-lines">' + lines +
          '<li><span>Engraving <span class="so-q">' + m.n + ' \u00d7 ' + gbp(ENG) + '</span></span><span>' + gbp(m.eng) + '</span></li>' +
          '<li><span>Setup <span class="so-q">flat fee</span></span><span>' + gbp(SETUP) + '</span></li>' +
        '</ul>' +
        '<p class="so-total"><span>Estimated total</span><strong>' + gbp(m.total) + '</strong></p>' +
        (m.n >= BULK ? '<p class="so-bulk">\u2713 Qualifies for a bulk discount, taken off in your quote</p>' : '') +
        '<p class="so-stock" data-opt-stock="' + i + '">Checking stock with our supplier\u2026</p>' +
        '<button type="button" class="btn btn-primary so-choose" data-opt="' + i + '" disabled>Checking stock\u2026</button>' +
      '</article>';
    }).join('');
    box.innerHTML =
      '<div class="so-intro">' +
        '<h2 class="so-title">' + (data.for ? 'Suggested options for ' + esc(data.for) : 'Your suggested options') + '</h2>' +
        '<p class="so-text">' + esc(data.note || 'Based on what you told us, we\u2019ve put together these options. Choose one to load it into your order, then change anything you like: the awards, sizes or quantities.') + '</p>' +
      '</div>' +
      '<div class="so-grid">' + cards + '</div>' +
      '<div class="so-actions">' +
        (opts.length > 1 ? '<button type="button" class="btn btn-secondary so-all" hidden>Not sure yet? Get a quote for all ' + opts.length + ' options</button>' : '') +
        '<button type="button" class="btn btn-secondary so-share" data-share-link>Share these options with your team</button>' +
      '</div>' +
      '<p class="so-small">Guide prices, plus UK delivery. Your quote confirms the final price, including any bulk discount. Nothing to pay today.</p>';
    box.hidden = false;
    ph('suggested_options_viewed', { options: opts.length });
    checkOptionStock(opts, idx);

    box.querySelectorAll('.so-choose').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        var i = +b.dataset.opt, opt = opts[i], m = optionMaths(opt, idx);
        setMeta({ ref: data.r || 'untitled', options: opts.length, choice: 'Option ' + (i + 1) + ' ' + (opt.n || ''), est: m.total, t: Date.now() });
        ph('suggested_option_chosen', { option: i + 1, option_name: opt.n || '', awards: m.n, est_total: Math.round(m.total) });
        loadIntoOrder([opt], idx, 'Chose Option ' + (i + 1) + ' from our suggested options: ' + (opt.n || '') + '.');
      });
    });
    var all = box.querySelector('.so-all');
    if (all) all.addEventListener('click', function () {
      var okOpts = opts.filter(function (o, i) { return available[i] !== false; });
      setMeta({ ref: data.r || 'untitled', options: opts.length, choice: 'Quote all ' + okOpts.length, est: null, t: Date.now() });
      ph('suggested_options_all', { options: okOpts.length });
      var names = opts.map(function (o, i) { return available[i] !== false ? 'Option ' + (i + 1) + ': ' + (o.n || '') : null; }).filter(Boolean).join('; ');
      loadIntoOrder(okOpts, idx, 'Please quote all ' + okOpts.length + ' suggested options separately so we can compare them (' + names + ').');
    });
  }

  // Live stock for each option, checked when the link is opened (stock can change after we send it).
  // An option that's sold out or short is greyed out and can't be loaded into the order.
  var available = {};
  function updateAll() {
    var all = box && box.querySelector('.so-all'); if (!all) return;
    var ok = Object.keys(available).filter(function (k) { return available[k]; });
    all.hidden = ok.length < 2;
    if (ok.length >= 2) all.textContent = 'Not sure yet? Get a quote for all ' + ok.length + ' options';
  }
  function checkOptionStock(opts, idx) {
    var S = document.documentElement.dataset.stockCheck;
    opts.forEach(function (opt, i) {
      var el = box.querySelector('[data-opt-stock="' + i + '"]'); if (!el) return;
      if (!S) { el.textContent = 'We confirm stock in your quote.'; available[i] = true; var b0 = box.querySelector('.so-choose[data-opt="' + i + '"]'); if (b0) { b0.disabled = false; b0.textContent = 'Choose option ' + (i + 1); } return; }
      var checks = (opt.l || []).map(function (pair) {
        var it = idx[pair[0]], need = Math.max(1, parseInt(pair[1], 10) || 1);
        if (!it || !it.src) return Promise.resolve({ ok: null });
        return fetch(S + '?url=' + encodeURIComponent(it.src)).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { return { ok: j && typeof j.in_stock === 'boolean' ? (j.in_stock && (j.qty == null || j.qty >= need)) : null, name: it.name }; })
          .catch(function () { return { ok: null }; });
      });
      Promise.all(checks).then(function (rs) {
        var short = rs.filter(function (r) { return r.ok === false; }), unknown = rs.some(function (r) { return r.ok === null; });
        var btn = box.querySelector('.so-choose[data-opt="' + i + '"]'), card = el.closest('.so-card');
        available[i] = !short.length;
        if (short.length) {
          el.className = 'so-stock so-stock-low';
          el.textContent = '\u26a0 Not enough stock right now on ' + short.map(function (r) { return r.name; }).join(' and ') + '. Choose another option, or reply to our email and we\u2019ll suggest the closest match.';
          if (card) card.classList.add('so-card-off');
          if (btn) { btn.disabled = true; btn.textContent = 'Not available right now'; }
        } else {
          if (unknown) el.textContent = 'We\u2019ll confirm stock in your quote.';
          else { el.className = 'so-stock so-stock-ok'; el.textContent = '\u2713 In stock for your whole order (checked just now)'; }
          if (btn) { btn.disabled = false; btn.textContent = 'Choose option ' + (i + 1); }
        }
        updateAll();
        ph('suggested_option_stock', { option: i + 1, short: short.length });
      });
    });
  }

  // Share: the suggested-options link as it is, or the current order turned into a link.
  function shareUrl() {
    if (code) { var copy = {}; Object.keys(data || {}).forEach(function (k) { if (k !== 'c') copy[k] = data[k]; }); return location.origin + '/quote/?options=' + encode(copy); }
    var Q = window.GrimesQuote; if (!Q) return location.origin + '/quote/';
    var lines = Q.get().lines.filter(function (l) { return l.kind !== 'plaque'; }).map(function (l) { return [l.sku, parseInt(l.qty, 10) || 1]; });
    var notes = document.getElementById('notes');
    var payload = { o: [{ n: 'Our order', l: lines }] };
    if (notes && notes.value.trim()) payload.note = notes.value.trim().slice(0, 400);
    return location.origin + '/quote/?options=' + encode(payload);
  }
  function share(btn) {
    var url = shareUrl(), title = 'Award options from Grimes Engravers';
    ph('order_shared', { from: code ? 'options' : 'order' });
    if (navigator.share) { navigator.share({ title: title, text: 'Have a look at these award options:', url: url }).catch(function () {}); return; }
    var done = function () { var t = btn.textContent; btn.textContent = '\u2713 Link copied: paste it in an email or Teams'; setTimeout(function () { btn.textContent = t; }, 3500); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link to share:', url); });
    else prompt('Copy this link to share:', url);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-share-link]');
    if (b) { e.preventDefault(); share(b); }
  });

  if (data) index().then(renderOptions).catch(function () {});
  // Tag the order form and analytics with the link and choice, then record when the order is actually sent.
  tagOrder();
  var form = document.getElementById('quote-form');
  if (form && meta) form.addEventListener('submit', function () {
    tagOrder();
    ph('suggested_options_order_sent', { option_choice: meta.choice || 'none', est_total: meta.est ? Math.round(meta.est) : null });
  }, true);
  // Once the order has actually gone, forget the link too: nothing from it stays in the browser.
  if (form) {
    var sent = form.onSent;
    form.onSent = function () { if (typeof sent === 'function') sent(); try { localStorage.removeItem(META_KEY); } catch (e) {} };
  }
})();
