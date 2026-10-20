/* Pre-built award sets: swap, quantities, live total, and "Add set to order" (adds every line to the basket). */
(function () {
  if (window.__gSets) return; window.__gSets = true;
  var ENG = 10.5, SETUP = 40;
  var gbp = function (n) { return '\u00a3' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var ph = function (ev, p) { try { window.posthog && window.posthog.capture(ev, p || {}); } catch (e) {} };
  function lines(set) {
    return Array.prototype.map.call(set.querySelectorAll('[data-line]'), function (li) {
      var sel = li.querySelector('select[data-sku]'), fixed = li.querySelector('[data-sku-fixed]');
      var opt = sel ? sel.options[sel.selectedIndex] : null;
      return { sku: sel ? sel.value : fixed.getAttribute('data-sku-fixed'), price: parseFloat(opt ? opt.getAttribute('data-price') : fixed.getAttribute('data-price')) || 0,
               qty: parseInt(li.querySelector('[data-q]').textContent, 10) || 0, li: li, opt: opt };
    });
  }
  function update(set) {
    var ls = lines(set), n = 0, aw = 0;
    ls.forEach(function (l) { n += l.qty; aw += l.qty * l.price; if (l.opt) l.li.querySelector('[data-img]').src = l.opt.getAttribute('data-img'); });
    set.querySelector('[data-total]').textContent = gbp(n ? aw + n * ENG + SETUP : 0);
    set.querySelector('[data-add-set]').disabled = n < 2;
  }
  document.addEventListener('change', function (e) { var s = e.target.closest && e.target.closest('[data-set]'); if (s && e.target.matches('select[data-sku]')) { update(s); ph('set_swapped', { set: s.getAttribute('data-set'), sku: e.target.value }); } });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-qty]');
    if (b) {
      var o = b.parentNode.querySelector('[data-q]'); o.textContent = Math.max(0, Math.min(500, (parseInt(o.textContent, 10) || 0) + parseInt(b.getAttribute('data-qty'), 10)));
      update(b.closest('[data-set]')); return;
    }
    var add = e.target.closest && e.target.closest('[data-add-set]');
    if (!add) return;
    var set = add.closest('[data-set]'), Q = window.GrimesQuote; if (!Q) return;
    add.disabled = true; add.textContent = 'Adding\u2026';
    fetch('/awards-index.json').then(function (r) { return r.json(); }).then(function (idx) {
      lines(set).forEach(function (l) {
        if (!l.qty || !idx[l.sku]) return;
        if (Q.has(l.sku)) {
          var d = Q.get(); d.lines.forEach(function (x) { if (x.sku === l.sku) x.qty = (parseInt(x.qty, 10) || 0) + l.qty; }); Q.save(d);
        } else {
          var item = {}; Object.keys(idx[l.sku]).forEach(function (k) { item[k] = idx[l.sku][k]; }); item.qty = l.qty; Q.add(item);
        }
      });
      ph('set_added', { set: set.getAttribute('data-set') });
      add.textContent = '\u2713 Added to your order'; setTimeout(function () { add.textContent = 'Add set to order'; add.disabled = false; }, 2500);
      if (Q.open) Q.open();
    }).catch(function () { add.textContent = 'Add set to order'; add.disabled = false; });
  });
})();
