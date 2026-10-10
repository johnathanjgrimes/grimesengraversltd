// Award finder (/award-finder/): shows the awards that match the occasion and budget, in-stock first,
// and adds them to the quote with the number chosen. Answers are kept in the address so it can be shared.
(function () {
  var form = document.getElementById('finder'), grid = document.getElementById('fd-grid');
  if (!form || !grid) return;
  var MIN = 2, STEP = 12, shown = STEP;
  var cards = [].slice.call(grid.querySelectorAll('.aw-card'));
  var count = document.getElementById('fd-count'), more = document.getElementById('fd-show');
  var empty = document.getElementById('fd-empty'), tip = document.getElementById('fd-tip'), qtyIn = document.getElementById('fd-qty'), jump = document.getElementById('fd-jump');
  var ph = function (e, p) { if (window.posthog) window.posthog.capture(e, p || {}); };
  var LABEL = { 'golf-awards': 'golf', 'football-awards': 'football', 'sports-awards': 'sports', 'retirement-awards': 'retirement', 'long-service-awards': 'long service' };

  function val(name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function qty() { return Math.max(MIN, parseInt(qtyIn.value, 10) || MIN); }

  // Start from the address (?for=golf-awards&qty=10&budget=20-40) when it has answers.
  var q = new URLSearchParams(location.search);
  ['for', 'budget'].forEach(function (k) {
    if (!q.has(k)) return;
    var el = form.querySelector('[name="' + k + '"][value="' + q.get(k).replace(/"/g, '') + '"]');
    if (el) el.checked = true;
  });
  if (q.get('qty')) qtyIn.value = Math.max(MIN, parseInt(q.get('qty'), 10) || MIN);

  function update(fromUser) {
    var occ = val('for'), budget = val('budget').split('-'), n = qty();
    var lo = parseFloat(budget[0]) || 0, hi = budget[1] ? parseFloat(budget[1]) : Infinity;
    var hits = cards.filter(function (c) {
      var p = parseFloat(c.dataset.price);
      return (!occ || (' ' + c.dataset.for + ' ').indexOf(' ' + occ + ' ') >= 0) && p >= lo && p < hi;
    });
    hits.sort(function (a, b) {
      return (b.dataset.stock === 'true') - (a.dataset.stock === 'true') || a.dataset.order - b.dataset.order;
    });
    cards.forEach(function (c) { c.hidden = true; });
    hits.forEach(function (c, i) { grid.appendChild(c); c.hidden = i >= shown; });
    grid.querySelectorAll('[data-add-quote]').forEach(function (b) { b.dataset.qty = n; });

    count.textContent = hits.length ? hits.length + (hits.length === 1 ? ' award fits' : ' awards fit') : 'No awards fit';
    empty.hidden = !!hits.length;
    jump.textContent = hits.length ? 'See ' + hits.length + (hits.length === 1 ? ' award' : ' awards') + ' ↓' : 'No awards fit: try another budget';
    more.hidden = hits.length <= shown;
    var tips = [];
    if (n >= 6) tips.push('Ordering ' + n + '? Most designs come in two or three sizes, so you can give a larger one to the overall winner. Mix them in one order.');
    if (LABEL[occ]) tips.push('See more ideas, wording and FAQs on our <a href="/' + occ + '/">' + LABEL[occ] + ' awards page</a>.');
    tip.innerHTML = tips.join(' ');
    tip.hidden = !tips.length;

    var params = new URLSearchParams();
    if (occ) params.set('for', occ);
    if (n !== MIN) params.set('qty', n);
    if (val('budget')) params.set('budget', val('budget'));
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''));
    if (fromUser) ph('award_finder', { occasion: occ || 'other', qty: n, budget: val('budget') || 'any', results: hits.length });
  }

  form.addEventListener('change', function () { shown = STEP; update(true); });
  qtyIn.addEventListener('input', function () { update(false); });
  more.addEventListener('click', function () { shown += STEP; update(false); });
  update(false);
})();
