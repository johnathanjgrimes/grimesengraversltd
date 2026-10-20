// Quote basket, on every page: kept in this browser only (localStorage), shown as a header button with
// a count, a slide-out panel to change quantities or remove awards, and "Add to quote" buttons.
// Other scripts use window.GrimesQuote to read and change it.
(function () {
  var KEY = 'grimes-quote-draft', MAX_AGE = 30 * 24 * 3600 * 1000, MIN = 2;
  var ph = function (e, p) { if (window.posthog) window.posthog.capture(e, p || {}); };

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d || Date.now() - d.t > MAX_AGE) return { lines: [], fields: {}, names: {} };
      d.lines = (d.lines || []).filter(function (l) { return l && l.sku && l.name; });
      return d;
    } catch (e) { return { lines: [], fields: {}, names: {} }; }
  }
  function save(d) { try { d.t = Date.now(); localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  // Live stock check through our Cloudflare worker (workers/stock-check), which reads the supplier's
  // product page. One check per award per page view; null if the checker is unavailable.
  var STOCK = document.documentElement.dataset.stockCheck, checks = {};
  // mode: 'fresh' for the final check before a quote is sent, 'page' for award pages (an older answer is
  // fine there). Keeps the previous answer if the new check fails.
  function checkStock(src, mode) {
    if (!STOCK || !src) return Promise.resolve(null);
    var fresh = mode === true || mode === 'fresh';
    if (fresh || !checks[src]) {
      var old = checks[src] && checks[src].result;
      var p = checks[src] = fetch(STOCK + '?url=' + encodeURIComponent(src) + (fresh ? '&fresh=1' : mode === 'page' ? '&page=1' : ''))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return j && typeof j.in_stock === 'boolean' ? j : null; })
        .catch(function () { return null; })
        .then(function (j) { p.result = j || old || null; return p.result; });
    }
    return checks[src];
  }
  // "25 in stock" / "Sold out", from a check result.
  function ago(iso) {
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (!(m >= 0)) return '';
    return m < 2 ? 'checked just now' : m < 60 ? 'checked ' + m + ' minutes ago' : 'checked ' + Math.round(m / 60) + (Math.round(m / 60) === 1 ? ' hour ago' : ' hours ago');
  }
  function stockLabel(j) {
    if (!j.in_stock) return 'Sold out at the moment';
    return j.qty != null ? j.qty + ' in stock' : 'In stock';
  }

  var listeners = [];
  var Q = window.GrimesQuote = {
    MIN: MIN,
    get: load,
    // quiet: the caller already shows the change (e.g. the quote form saving what's typed).
    save: function (d, quiet) { save(d); render(); if (!quiet) listeners.forEach(function (f) { f(d); }); },
    onChange: function (f) { listeners.push(f); },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} render(); listeners.forEach(function (f) { f(load()); }); },
    checkStock: checkStock,
    stockLabel: stockLabel,
    // The finished check for a line, if any: { in_stock, checked }.
    stockFor: function (l) { return l && l.src && checks[l.src] ? checks[l.src].result || null : null; },
    // Record a fresh result on the line so the panel and the emailed summary use it.
    setStock: function (sku, inStock) {
      var d = load(), l = d.lines.filter(function (x) { return x.sku === sku; })[0];
      if (!l || l.stock === inStock) return;
      l.stock = inStock; save(d); render(); listeners.forEach(function (f) { f(d); });
    },
    has: function (sku) { return load().lines.some(function (l) { return l.sku === sku; }); },
    add: function (item) {
      var d = load();
      // Plaques get a unique code per design, so several different plaques can sit in one order.
      if (!d.lines.some(function (l) { return l.sku === item.sku; })) {
        // Start each award at the minimum order (plaques at the quantity chosen in the designer); people change it in the panel or on the form.
        d.lines.push({ sku: item.sku, kind: item.kind || 'award', name: item.name, image: item.image, price: item.price, unit: item.unit != null ? +item.unit : undefined, size: item.size, area: item.area, fitChars: item.fitChars, fitLines: item.fitLines, url: item.url, src: item.src, details: item.details, design: item.design, optionsText: item.optionsText, group: item.group || undefined, stock: item.stock !== false, qty: item.qty || (item.kind === 'plaque' ? 1 : MIN) });
        ph(item.kind === 'plaque' ? 'quote_plaque_added' : 'quote_award_added', { sku: item.sku });
      }
      Q.save(d);
    },
    setQty: function (sku, qty) { var d = load(); d.lines.forEach(function (l) { if (l.sku === sku) l.qty = qty; }); Q.save(d); },
    // Change fields on one line (used to edit a plaque's wording or design). quiet: don't redraw the order page.
    patch: function (sku, fields, quiet) {
      var d = load();
      d.lines.forEach(function (l) { if (l.sku === sku) { Object.keys(fields).forEach(function (k) { l[k] = fields[k]; }); if (l.kind === 'plaque') l.details = Q.plaqueDetails(l); } });
      Q.save(d, quiet);
    },
    line: function (sku) { return load().lines.filter(function (l) { return l.sku === sku; })[0]; },
    // A plaque's one-line description: wording, then its options and notes.
    plaqueDetails: function (l) {
      var w = (l.design && l.design.wording || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join(' / ');
      return 'Wording: ' + (w || '(to follow)') + (l.optionsText ? ' · ' + l.optionsText : '');
    },
    // Draw a plaque design as a small PNG for the basket and checkout, matching the designer's preview:
    // metal, size, corners, border, screw holes, emblem and wording. r comes from public/js/plaque.js.
    renderPlaque: function (r, wording) {
      try {
        if (!r) return null;
        var ratio = r.h / r.w, cw = ratio > 0.75 ? Math.round(360 / ratio) : 480, ch = Math.round(cw * ratio), pad = 14;
        var c = document.createElement('canvas'); c.width = cw + pad * 2; c.height = ch + pad * 2;
        var x = c.getContext('2d');
        x.fillStyle = '#F3F4F6'; x.fillRect(0, 0, c.width, c.height);
        var rr = function (px, py, w, h, rad) { x.beginPath(); x.moveTo(px + rad, py); x.arcTo(px + w, py, px + w, py + h, rad); x.arcTo(px + w, py + h, px, py + h, rad); x.arcTo(px, py + h, px, py, rad); x.arcTo(px, py, px + w, py, rad); x.closePath(); };
        var g = x.createLinearGradient(pad, pad, pad + cw, pad + ch);
        if (r.mat === 'brass') { g.addColorStop(0, '#D8B76A'); g.addColorStop(0.55, '#B8914A'); g.addColorStop(1, '#D2AE62'); }
        else { g.addColorStop(0, '#E4E7EA'); g.addColorStop(0.55, '#C3C8CD'); g.addColorStop(1, '#DDE0E3'); }
        x.save(); x.shadowColor = 'rgba(0,0,0,0.3)'; x.shadowBlur = 8; x.shadowOffsetY = 2; x.fillStyle = g;
        rr(pad, pad, cw, ch, r.corners === 'round' ? cw * 0.04 : 2); x.fill(); x.restore();
        if (r.border) { x.save(); x.globalAlpha = 0.8; x.strokeStyle = r.ink; x.lineWidth = 2; rr(pad + cw * 0.09, pad + ch * 0.09, cw * 0.82, ch * 0.82, 3); x.stroke(); x.restore(); }
        if (r.holes) {
          var hr = cw * 0.016, off = cw * 0.035 + hr;
          [[pad + off, pad + off], [pad + cw - off, pad + off], [pad + off, pad + ch - off], [pad + cw - off, pad + ch - off]].forEach(function (p) {
            var hg = x.createRadialGradient(p[0] - hr * 0.2, p[1] - hr * 0.2, 0, p[0], p[1], hr); hg.addColorStop(0, '#F2F2F2'); hg.addColorStop(1, '#6B7280');
            x.beginPath(); x.arc(p[0], p[1], hr, 0, Math.PI * 2); x.fillStyle = hg; x.fill();
          });
        }
        var lines = String(wording || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        var paths = []; String(r.emblemSvg || '').replace(/\sd="([^"]+)"/g, function (m, d) { paths.push(d); });
        var iw = cw * 0.74, ih = ch * 0.76, rows = lines.length + (paths.length ? 1.4 : 0);
        if (!rows) return c.toDataURL('image/png');
        var px = Math.min(ih / rows / 1.3, iw / 4), font = function () { return (r.fstyle === 'italic' ? 'italic ' : '') + px + 'px ' + r.fam; };
        for (var i = 0; i < 40; i++) {
          x.font = font();
          var widest = lines.reduce(function (m, l) { return Math.max(m, x.measureText(l).width); }, 0);
          if (widest <= iw && rows * px * 1.3 <= ih) break;
          px *= 0.93;
        }
        var total = lines.length * px * 1.3 + (paths.length ? px * 1.65 : 0), y = pad + ch / 2 - total / 2;
        x.fillStyle = r.ink;
        if (paths.length) {
          var s = px * 1.4 / 24; x.save(); x.translate(pad + cw / 2 - px * 0.7, y); x.scale(s, s);
          paths.forEach(function (d) { x.fill(new Path2D(d)); }); x.restore(); y += px * 1.65;
        }
        x.font = font(); x.textAlign = 'center'; x.textBaseline = 'middle';
        lines.forEach(function (l) { x.fillText(l, pad + cw / 2, y + px * 0.65); y += px * 1.3; });
        return c.toDataURL('image/png');
      } catch (e) { return null; }
    },
    remove: function (sku) { var d = load(); d.lines = d.lines.filter(function (l) { return l.sku !== sku; }); ph('quote_award_removed', { sku: sku }); Q.save(d); },
    total: function (d) { return (d || load()).lines.reduce(function (s, l) { return s + (parseInt(l.qty, 10) || 0); }, 0); },
    // The minimum order applies to awards only; plaques have no minimum.
    isPlaque: function (l) { return l.kind === 'plaque'; },
    awardTotal: function (d) { return (d || load()).lines.reduce(function (s, l) { return s + (l.kind === 'plaque' ? 0 : (parseInt(l.qty, 10) || 0)); }, 0); },
    hasPlaques: function (d) { return (d || load()).lines.some(function (l) { return l.kind === 'plaque'; }); },
    short: function (d) { d = d || load(); var a = Q.awardTotal(d); return a > 0 && a < MIN; },
    PLAQUE_NOTE: 'Plaque prices are confirmed with your proof.',
    // Running total at "from" prices: quantity × per-award price. Engraving and delivery are quoted separately.
    unit: function (l) { return l.unit != null ? +l.unit : parseFloat(String(l.price || '').replace(/[^0-9.]/g, '')) || 0; },
    money: function (d) { return (d || load()).lines.reduce(function (s, l) { return s + Q.unit(l) * (parseInt(l.qty, 10) || 0); }, 0); },
    // Guide price shown in the basket: awards + engraving per award + one setup per order (plaques priced with the proof).
    ENGRAVING: 10.50, SETUP: 40.00,
    estimate: function (d) {
      d = d || load(); var gs = Q.groups(d);
      // Several options side by side: show the cheapest option (the customer will order only one).
      if (gs.length > 1) return Math.min.apply(null, gs.map(function (g) { return g.total; }));
      var a = Q.awardTotal(d); return Q.money(d) + (a > 0 ? a * Q.ENGRAVING + Q.SETUP : 0);
    },
    // Options quoted side by side (from a suggested-options link): lines carry a group, e.g. "Option 1: Hexagon".
    // Each option is priced on its own (its awards + engraving + one setup), because the customer orders only one.
    groups: function (d) {
      d = d || load(); var order = [], by = {};
      d.lines.forEach(function (l) { if (!l.group || l.kind === 'plaque') return; if (!by[l.group]) { by[l.group] = []; order.push(l.group); } by[l.group].push(l); });
      return order.map(function (g) {
        var n = 0, awards = 0; by[g].forEach(function (l) { var q = parseInt(l.qty, 10) || 0; n += q; awards += Q.unit(l) * q; });
        return { name: g, lines: by[g], n: n, awards: awards, engraving: n * Q.ENGRAVING, total: n ? awards + n * Q.ENGRAVING + Q.SETUP : 0 };
      });
    },
    gbp: function (n) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    TOTAL_NOTE: 'Includes engraving and setup. Plus delivery. 20+ awards? Bulk discount in your quote.',
    PAY_NOTE: 'Nothing to pay today. We’ll send a free proof first; once you approve it, we ask for a deposit or full payment before we engrave.',
    open: function () { openPanel(); },
  };

  // Header button, bottom bar and panel.
  var btn = document.getElementById('quote-open');
  var bar = document.getElementById('quote-bar');
  var panel = document.getElementById('quote-panel');
  var list = panel && panel.querySelector('[data-panel-list]');
  var lastFocus = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    var d = load(), n = d.lines.length, total = Q.total(d), money = (Q.groups(d).length > 1 ? Q.groups(d).length + ' options, from ' : '') + Q.gbp(Q.estimate(d));
    if (btn) {
      btn.hidden = !n;
      btn.querySelector('[data-quote-count]').textContent = n;
      btn.setAttribute('aria-label', 'Your order, ' + n + (n === 1 ? ' award' : ' awards'));
    }
    if (bar) {
      bar.hidden = !n || location.pathname === '/quote/';
      bar.querySelector('[data-quote-bar-text]').innerHTML = thumbs(d.lines, 4) + '<span>' + total + (total === 1 ? ' item' : ' items') + (money !== '£0.00' ? ' · <strong>est. ' + money + '</strong>' : '') +
        (Q.short(d) ? ' <span class="quote-bar-warn">(minimum ' + MIN + ' awards)</span>' : '') + ' <span class="quote-bar-pay">· nothing to pay today</span></span>';
    }
    renderPeek(d, n, total, money);
    document.querySelectorAll('[data-add-quote]').forEach(function (b) {
      var inQ = d.lines.some(function (l) { return l.sku === b.dataset.sku; });
      b.textContent = inQ ? '✓ In your order' : (b.dataset.label || 'Add to order');
      // aria-pressed is only valid on buttons; the award page's link says "✓ In your quote" instead.
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(inQ));
    });
    if (!list) return;
    list.innerHTML = n ? d.lines.map(function (l) {
      return '<li class="flex gap-3 border-0 border-b border-solid py-3" style="border-color: #E5E7EB">' +
        '<img src="' + esc(l.image) + '" alt="" width="64" height="64" class="block flex-none rounded" style="width: 4rem; height: 4rem; background: #F5F6F7; object-fit: ' + (l.kind === 'plaque' ? 'contain' : 'cover') + '">' +
        '<div class="min-w-0 flex-1"><a href="' + esc(l.url) + '" class="font-bold text-ink no-underline">' + esc(l.name) + '</a>' +
        '<p class="muted m-0 text-sm">' + (l.kind === 'plaque' ? esc(l.details || '') : esc(l.sku) + (l.price ? ' · ' + esc(l.price) : '') + (l.stock === false ? ' · out of stock' : '')) + '</p>' +
        '<div class="mt-2 flex items-center gap-3"><label class="flex items-center gap-2 text-sm font-semibold">Qty <input type="number" min="1" inputmode="numeric" class="inp" style="width: 5.5rem; padding: 0.4rem 0.5rem" data-panel-qty="' + esc(l.sku) + '" value="' + esc(l.qty) + '"></label>' +
        '<button type="button" class="text-sm font-semibold" style="background: none; border: none; color: #8A1C1C; cursor: pointer; text-decoration: underline; min-height: 44px" data-panel-remove="' + esc(l.sku) + '">Remove</button></div></div></li>';
    }).join('') : '<li class="muted py-6 text-center">Your order is empty. Add awards from the catalogue, or design a bench plaque.</li>';
    var note = panel.querySelector('[data-panel-total]');
    var sh = Q.short(d);
    note.innerHTML = n ? '<span class="quote-total"><span>Estimated total</span><strong>' + money + '</strong></span><span class="muted block text-xs font-normal">' + Q.TOTAL_NOTE + (Q.hasPlaques(d) ? ' ' + Q.PLAQUE_NOTE : '') + '</span>' +
      '<span class="block mt-1">' + total + (total === 1 ? ' item' : ' items') + (sh ? ' (minimum order ' + MIN + ' awards)' : '') + '</span>' +
      '<span class="quote-pay-note">✓ ' + Q.PAY_NOTE + ' <a href="/why-we-proof-first/">Why?</a></span>' : '';
    note.style.color = n && sh ? '#8A1C1C' : '';
    panel.querySelector('[data-panel-continue]').hidden = !n;
  }

  // Overlapping photos for the bar and the hover preview.
  function thumbs(lines, max) {
    return '<span class="quote-thumbs" aria-hidden="true">' + lines.slice(0, max).map(function (l) { return '<img src="' + esc(l.image) + '" alt="" width="40" height="40">'; }).join('') +
      (lines.length > max ? '<span class="quote-thumbs-more">+' + (lines.length - max) + '</span>' : '') + '</span>';
  }

  // Hover preview under the header button (mouse only; a click/tap opens the full panel).
  var peek, peekTimer;
  function renderPeek(d, n, total, money) {
    if (!btn) return;
    if (!peek) {
      peek = document.createElement('div');
      peek.className = 'quote-peek';
      peek.hidden = true;
      document.body.appendChild(peek);
      var show = function () { if (!window.matchMedia('(hover: hover)').matches || !load().lines.length) return; clearTimeout(peekTimer); place(); peek.hidden = false; };
      var hide = function () { clearTimeout(peekTimer); peekTimer = setTimeout(function () { peek.hidden = true; }, 250); };
      btn.addEventListener('mouseenter', show);
      btn.addEventListener('mouseleave', hide);
      peek.addEventListener('mouseenter', function () { clearTimeout(peekTimer); });
      peek.addEventListener('mouseleave', hide);
      window.addEventListener('scroll', function () { peek.hidden = true; }, { passive: true });
    }
    var rows = d.lines.slice(0, 4).map(function (l) {
      return '<li><img src="' + esc(l.image) + '" alt="" width="48" height="48"><span class="min-w-0 flex-1"><span class="block font-semibold leading-snug">' + esc(l.name) + '</span>' +
        '<span class="muted block text-sm">' + esc(l.qty) + ' × ' + (l.price ? esc(l.price) : '') + '</span></span></li>';
    }).join('');
    peek.innerHTML = '<div class="mb-3 flex items-baseline justify-between gap-3 border-0 border-b border-solid pb-2" style="border-color: #E5E7EB"><p class="m-0 font-bold">Your order</p><p class="m-0 text-sm">Estimated total: <strong>' + money + '</strong></p></div><ul class="quote-peek-list">' + rows + '</ul>' +
      (n > 4 ? '<p class="muted m-0 mt-1 text-sm">and ' + (n - 4) + ' more</p>' : '') +
      '<p class="m-0 mt-3 text-sm font-semibold"' + (Q.short(d) ? ' style="color: #8A1C1C"' : '') + '>' + total + (total === 1 ? ' item' : ' items') + (Q.short(d) ? ' (minimum ' + MIN + ' awards)' : '') + '</p>' +
      '<p class="muted m-0 text-xs">' + Q.TOTAL_NOTE + ' Nothing to pay today.</p>' +
      '<div class="mt-3 flex gap-2"><button type="button" class="btn ghost flex-1" data-open-quote style="padding: 0.55rem 0.8rem">View &amp; edit</button><a href="/quote/" class="btn flex-1 text-center" style="padding: 0.55rem 0.8rem">Continue →</a></div>';
    if (!n) peek.hidden = true;
  }
  function place() {
    var r = btn.getBoundingClientRect();
    peek.style.top = (r.bottom + 8) + 'px';
    peek.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
  }

  function openPanel() {
    if (peek) peek.hidden = true;
    if (!panel) return;
    lastFocus = document.activeElement;
    render();
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    panel.querySelector('[data-panel-close]').focus();
    ph('quote_panel_opened');
  }
  function closePanel() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (btn) btn.addEventListener('click', openPanel);
  // Award pages show the live count straight away (shared by everyone through the worker's store).
  if (STOCK) document.querySelectorAll('[data-check-stock]').forEach(function (b) { b.hidden = false; b.click(); });
  document.addEventListener('click', function (e) {
    var cs = e.target.closest('[data-check-stock]');
    if (cs) {
      var out = document.querySelector(cs.dataset.checkStock);
      cs.disabled = true; cs.textContent = 'Checking…';
      checkStock(cs.dataset.src, 'page').then(function (j) {
        cs.hidden = true;
        if (!j) { out.textContent = 'We couldn’t check just now. We confirm stock in your quote.'; return; }
        out.innerHTML = j.in_stock ? '<strong style="color: #166534">✓ ' + stockLabel(j) + '</strong> <span class="muted text-sm">(' + (ago(j.checked) || 'live') + ' with our supplier)</span>'
          : '<strong style="color: #8A1C1C">Sold out at the moment.</strong> <span class="muted text-sm">Add it anyway and we’ll suggest the closest match, or ask us for the restock date.</span>';
        if (Q.has(cs.dataset.sku)) Q.setStock(cs.dataset.sku, j.in_stock);
        ph('stock_checked', { sku: cs.dataset.sku, in_stock: j.in_stock });
      });
      return;
    }
    var t = e.target.closest('[data-open-quote]'); if (t) { e.preventDefault(); openPanel(); return; }
    var add = e.target.closest('[data-add-quote]');
    if (add) {
      e.preventDefault();
      if (Q.has(add.dataset.sku)) { openPanel(); return; }
      Q.add({ sku: add.dataset.sku, name: add.dataset.name, image: add.dataset.image, price: add.dataset.price, unit: parseFloat(add.dataset.unit) || undefined, size: add.dataset.size, area: add.dataset.area,
        fitChars: parseInt(add.dataset.fitChars, 10) || null, fitLines: parseInt(add.dataset.fitLines, 10) || null, url: add.dataset.url, src: add.dataset.src, stock: add.dataset.stock !== 'false', qty: parseInt(add.dataset.qty, 10) || undefined });
      toast(add.dataset.name);
    }
  });
  if (panel) {
    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('[data-panel-close]')) closePanel();
      var r = e.target.closest('[data-panel-remove]'); if (r) Q.remove(r.dataset.panelRemove);
    });
    panel.addEventListener('change', function (e) {
      var q = e.target.dataset.panelQty;
      if (q) Q.setQty(q, Math.max(1, parseInt(e.target.value, 10) || 1));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  }

  // Small confirmation after adding, with a shortcut to the panel.
  var toastEl;
  function toast(name) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.className = 'fixed z-30 flex items-center gap-4 rounded-lg px-5 py-3 text-white';
      toastEl.style.cssText = 'left: 50%; bottom: 5.5rem; transform: translateX(-50%); background: #2F7A4F; box-shadow: 0 4px 16px rgba(0,0,0,0.25); max-width: calc(100% - 2rem)';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span>Added to your order: <strong>' + esc(name) + '</strong></span><button type="button" data-open-quote class="font-bold" style="background: #fff; color: #2F7A4F; border: none; border-radius: 6px; padding: 0.45rem 0.8rem; cursor: pointer">View order</button>';
    toastEl.hidden = false;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.hidden = true; }, 4000);
  }

  window.addEventListener('storage', function (e) { if (e.key === KEY) render(); });
  render();
})();
