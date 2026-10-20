/* Christmas countdown (and the "Needed by" check at checkout).
   Data: src/data/seasons.json, embedded in every page by Base.astro (#seasons-data).
   Honest by design: counts to real 5pm order-by deadlines, always the NEAREST one, never resets,
   and everything disappears after the final deadline. Never shown on bench plaque or memorial pages. */
(function () {
  var el = document.getElementById('seasons-data'); if (!el) return;
  var S; try { S = JSON.parse(el.textContent); } catch (e) { return; }
  var C = S.christmas || {}, path = location.pathname;
  var now = function () { return Date.now(); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var day = function (iso, opts) { return new Date(iso).toLocaleDateString('en-GB', Object.assign({ timeZone: 'Europe/London' }, opts)); };
  var short = function (iso) { return day(iso, { weekday: 'short', day: 'numeric', month: 'short' }); };   // Fri 6 Nov
  var long = function (iso) { return day(iso, { weekday: 'long', day: 'numeric', month: 'long' }); };     // Friday 6 November
  var ph = function (ev, p) { try { window.posthog && window.posthog.capture(ev, p || {}); } catch (e) {} };

  var css = document.createElement('style');
  css.textContent =
    '.xm-strip{background:#C8202A;color:#fff;padding:.45rem 1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.25rem .75rem;font-size:.92rem;line-height:1.3}' +
    '.xm-strip p{margin:0}.xm-title{font-weight:700;letter-spacing:.03em;text-transform:uppercase}' +
    '.xm-strip a{color:#fff;font-weight:700;text-decoration:underline;text-underline-offset:2px}' +
    '.xm-clock{display:inline-flex;gap:.3rem;align-items:center;flex-wrap:wrap;justify-content:center;font-variant-numeric:tabular-nums}' +
    '.xm-pill{background:#fff;color:#1F2933;border-radius:6px;padding:.05rem .4rem;font-weight:800;font-size:.88rem}' +
    '.xm-award .xm-pill,.xm-panel .xm-pill{font-size:1rem;padding:.15rem .5rem}' +
    '.xm-panel{display:flex;flex-wrap:wrap;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.15);margin:2rem auto;max-width:72rem}' +
    '.xm-panel .xm-red{flex:1 1 22rem;background:#C8202A;color:#fff;padding:1.75rem}.xm-panel .xm-red h2{margin:0 0 .4rem;font-size:clamp(1.4rem,3vw,1.8rem);font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:#fff}' +
    '.xm-panel .xm-red p{margin:0 0 1rem}.xm-panel .xm-side{flex:1 1 24rem;padding:1.5rem 1.75rem}' +
    '.xm-panel table{width:100%;border-collapse:collapse}.xm-panel th{text-align:left;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#6B7280;padding:.35rem 0}' +
    '.xm-panel td{padding:.6rem 0;border-top:1px solid #E5E7EB}.xm-badge{display:inline-block;padding:.15rem .55rem;border-radius:999px;font-weight:700;font-size:.9rem}' +
    '.xm-ticks{list-style:none;margin:1rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.4rem 1rem;color:#166534;font-weight:700;font-size:.9rem}' +
    '.xm-btn{display:inline-block;margin-top:1rem;background:#23263A;color:#fff!important;text-decoration:none;font-weight:700;padding:.75rem 1.4rem;border-radius:6px}' +
    '.xm-award{background:#C8202A;color:#fff;border-radius:12px;padding:1rem 1.2rem;margin:0 0 1.25rem}.xm-award p{margin:0 0 .5rem}.xm-award .xm-t{font-weight:800;text-transform:uppercase;letter-spacing:.03em;font-size:1.15rem}' +
    '.xm-need{margin:.5rem 0 0;padding:.65rem .8rem;border-radius:8px;font-weight:600;font-size:.95rem}.xm-ok{background:#F0F7F2;color:#166534}.xm-tight{background:#FDECEC;color:#8A1C1C}';
  document.head.appendChild(css);

  // ---------- Christmas ----------
  var deadlines = (C.deadlines || []).slice().sort(function (a, b) { return Date.parse(a.orderBy) - Date.parse(b.orderBy); });
  var finalD = deadlines[deadlines.length - 1];
  var active = finalD && now() >= Date.parse(C.showFrom || 0) && now() < Date.parse(finalD.orderBy);
  // Only where Christmas awards make sense: listed pages, plus award pages that aren't in a sports range.
  var slotRange = (document.querySelector('[data-christmas-award]') || { getAttribute: function () { return ''; } }).getAttribute('data-range') || '';
  var isAwardPage = C.awardPagesPrefix && path.indexOf(C.awardPagesPrefix) === 0 && path !== C.awardPagesPrefix;
  var hidden = isAwardPage ? (C.noAwardRanges || []).indexOf(slotRange) > -1 : (C.showOnPaths || []).indexOf(path) === -1;
  var nearest = function () { return deadlines.filter(function (d) { return Date.parse(d.orderBy) > now(); })[0]; };
  var clocks = [];
  function clockHtml(label) { return '<span class="xm-clock" role="timer" aria-live="off" data-xm-clock><span>' + label + '</span><span class="xm-pill" data-u="d">00d</span><span class="xm-pill" data-u="h">00h</span><span class="xm-pill" data-u="m">00m</span><span class="xm-pill" data-u="s">00s</span></span>'; }
  function tick() {
    var d = nearest(); if (!d) { document.querySelectorAll('[data-xm]').forEach(function (n) { n.remove(); }); return; }
    var left = Math.max(0, Date.parse(d.orderBy) - now());
    var v = { d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24, m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60 };
    document.querySelectorAll('[data-xm-clock]').forEach(function (c) {
      ['d', 'h', 'm', 's'].forEach(function (u) { var p = c.querySelector('[data-u="' + u + '"]'); if (p) p.textContent = pad(v[u]) + u; });
      c.setAttribute('aria-label', v.d + ' days ' + v.h + ' hours left to order');
    });
    document.querySelectorAll('[data-xm-headline]').forEach(function (h) { h.textContent = headline(d); });
    document.querySelectorAll('[data-xm-row]').forEach(function (r) {
      var ob = r.getAttribute('data-xm-row'), days = Math.ceil((Date.parse(ob) - now()) / 864e5), b = r.querySelector('.xm-badge');
      b.textContent = days > 0 ? days + (days === 1 ? ' day left' : ' days left') : 'Closed';
      b.style.background = days <= 0 ? '#E5E7EB' : days <= 7 ? '#FDECEC' : '#FFF8E6';
      b.style.color = days <= 0 ? '#6B7280' : days <= 7 ? '#8A1C1C' : '#8A4B00';
    });
  }
  function headline(d) { return d.final ? 'Last Christmas orders \u00b7 ' + long(d.orderBy) : 'Christmas party on ' + short(d.party) + '? Order by ' + short(d.orderBy); }

  if (active && !hidden) {
    var d0 = nearest();
    // (a) Strip above the header.
    var strip = document.createElement('div');
    strip.className = 'xm-strip'; strip.setAttribute('data-xm', ''); strip.setAttribute('role', 'region'); strip.setAttribute('aria-label', 'Christmas order deadline');
    strip.innerHTML = '<p class="xm-title" data-xm-headline>' + headline(d0) + '</p>' + clockHtml('Ends in') + '<a href="/glass-awards/">Choose your awards</a>';
    var skip = document.querySelector('.skip-link');
    document.body.insertBefore(strip, skip ? skip.nextSibling : document.body.firstChild);

    // (b) Occasion panel, wherever a page has [data-christmas-panel].
    document.querySelectorAll('[data-christmas-panel]').forEach(function (slot) {
      var slug = slot.getAttribute('data-christmas-panel') || '';
      if ((C.panelOn || []).indexOf(slug) === -1) return;
      var what = 'your Christmas party';
      var rows = deadlines.map(function (d) { return '<tr data-xm-row="' + d.orderBy + '"><td><strong>' + long(d.party) + '</strong></td><td>' + long(d.orderBy) + '</td><td><span class="xm-badge"></span></td></tr>'; }).join('');
      slot.innerHTML = '<section class="xm-panel" data-xm aria-labelledby="xm-h"><div class="xm-red"><h2 id="xm-h">Awards for ' + what + '</h2><p>Find your date and order by the date shown. We\u2019ll send your free proof within 24 hours.</p>' + clockHtml('Last orders in') + '</div>' +
        '<div class="xm-side"><table><caption style="text-align:left;font-weight:700;padding-bottom:.4rem;color:#3D5A5E">When to order</caption><thead><tr><th scope="col">Event on</th><th scope="col">Order by</th><th scope="col">Time left</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<ul class="xm-ticks"><li>\u2713 Nothing to pay today</li><li>\u2713 Send names later</li><li>\u2713 Change anything until you approve the proof</li></ul>' +
        '<a class="xm-btn" href="/glass-awards/" data-xm-cta>Reserve my Christmas date</a></div></section>';
    });

    // (c) Award page block, wherever a page has [data-christmas-award].
    document.querySelectorAll('[data-christmas-award]').forEach(function (slot) {
      slot.innerHTML = '<div class="xm-award" data-xm><p class="xm-t">Christmas awards</p><p>Order by <strong data-xm-orderby>' + long(nearest().orderBy) + '</strong> for a Christmas party on ' + short(nearest().party) + (nearest().final ? ' (last Christmas orders)' : '') + '.</p>' + clockHtml('Ends in') + '</div>';
    });

    tick(); setInterval(tick, 1000);
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-xm] a')) ph('christmas_countdown_clicked', { where: e.target.closest('.xm-strip') ? 'strip' : e.target.closest('.xm-panel') ? 'panel' : 'award' }); });
    ph('christmas_countdown_shown', { deadline: d0.orderBy.slice(0, 10) });
  }

  // ---------- (d) Checkout "Needed by": in time, or tight? (all year) ----------
  var need = document.getElementById('needed_by');
  if (need) {
    var msg = document.createElement('p'); msg.className = 'xm-need'; msg.hidden = true; msg.setAttribute('aria-live', 'polite');
    need.insertAdjacentElement('afterend', msg);
    var check = function () {
      if (!need.value) { msg.hidden = true; return; }
      var needed = new Date(need.value + 'T12:00:00Z');
      var orderBy = new Date(needed.getTime() - (S.leadDays || 28) * 864e5);
      // Use the published Christmas deadline when the date matches one of those parties.
      deadlines.forEach(function (d) { if (Math.abs(Date.parse(d.party + 'T12:00:00Z') - needed.getTime()) < 864e5 * 3) orderBy = new Date(d.orderBy); });
      orderBy.setUTCHours(17, 0, 0, 0);
      msg.hidden = false;
      if (now() <= orderBy.getTime()) {
        msg.className = 'xm-need xm-ok';
        msg.textContent = '\u2713 You\u2019re in time. Order by ' + long(orderBy.toISOString()) + ' and approve your proof within 1 working day.';
      } else {
        msg.className = 'xm-need xm-tight';
        msg.textContent = 'That\u2019s tight for our usual 10\u201314 working days after the proof. Send your order anyway and tell us your date in the notes: we\u2019ll tell you straight away if we can do it.';
      }
      ph('needed_by_checked', { in_time: msg.className.indexOf('xm-ok') > -1 });
    };
    need.addEventListener('change', check); need.addEventListener('input', check);
    setTimeout(check, 300);
  }
})();
