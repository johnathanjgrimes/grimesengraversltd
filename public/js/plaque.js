// Bench plaque designer: live preview, wording fit guide and the summary sent with the quote request.
(function () {
  var form = document.getElementById('plaque-form');
  if (!form) return;
  var data = JSON.parse(document.getElementById('plaque-data').textContent);
  var plate = document.getElementById('pq-plate');
  var inner = document.getElementById('pq-inner');
  var text = document.getElementById('pq-text');
  var emblem = document.getElementById('pq-emblem');
  var border = document.getElementById('pq-border');
  var holes = document.getElementById('pq-holes');
  var fit = document.getElementById('pq-fit');
  var wording = document.getElementById('pq-wording');
  var size = document.getElementById('pq-size');
  var summary = form.querySelector('[data-summary]');
  var byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };
  var picked = function (name, attr) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.getAttribute(attr) : null; };

  // Example wording that suits each emblem. Only swapped in while the box still holds an example,
  // so anything the customer has typed is never replaced.
  var examples = {
    none: 'In loving memory of\nMargaret Jones\n1938 – 2024\nWho loved this view',
    paw: 'In memory of Bella\nwho loved every\nwalk in this park',
    cross: 'In loving memory of\nMargaret Jones\n1938 – 2024\nRest in peace',
    heart: 'Forever in our hearts\nMargaret Jones\n1938 – 2024',
  };
  var isExample = function () { var v = wording.value.trim(); return !v || Object.keys(examples).some(function (k) { return examples[k] === v; }); };
  var matchEmblem = function () {
    if (!isExample()) return;
    wording.value = examples[picked('emblem', 'data-emblem')] || examples.none;
  };
  form.addEventListener('change', function (e) { if (e.target.name === 'emblem') matchEmblem(); });

  // Wording passed from the font preview or wording ideas pages (sessionStorage, never the URL).
  try {
    var p = JSON.parse(sessionStorage.getItem('plaque-preview') || 'null');
    if (p) {
      if (p.wording) wording.value = p.wording;
      form.querySelectorAll('input[name="font"]').forEach(function (r) { if (r.value === p.font) r.checked = true; });
      form.querySelectorAll('input[name="material"]').forEach(function (r) { if (r.value === p.material) r.checked = true; });
      form.querySelectorAll('input[name="emblem"]').forEach(function (r) { if (r.value === p.emblem) r.checked = true; });
      sessionStorage.removeItem('plaque-preview');
      if (!p.wording) matchEmblem();
    }
  } catch (e) {}

  function render() {
    var f = byId(data.fonts, picked('font', 'data-font'));
    var m = byId(data.mats, picked('material', 'data-mat'));
    var e = byId(data.emblems, picked('emblem', 'data-emblem'));
    var sid = size.options[size.selectedIndex].getAttribute('data-size');
    var s = byId(data.sizes, sid) || byId(data.sizes, '6x4');
    var lines = wording.value.split('\n').filter(function (l) { return l.trim(); });
    var longest = lines.reduce(function (a, l) { return Math.max(a, l.length); }, 0);

    // Plate shape and finish.
    plate.style.aspectRatio = s.w + ' / ' + s.h;
    plate.style.maxWidth = s.h / s.w > 0.6 ? '22rem' : '100%';
    plate.style.background = m.id === 'brass' ? 'linear-gradient(135deg, #D8B76A, #B8914A 55%, #D2AE62)' : 'linear-gradient(135deg, #E4E7EA, #C3C8CD 55%, #DDE0E3)';
    plate.style.color = m.ink;
    plate.style.borderRadius = picked('corners', 'data-corners') === 'round' ? '4% / ' + (4 * s.w / s.h) + '%' : '2px';
    border.hidden = picked('border', 'data-border') !== '1';
    border.style.borderRadius = picked('corners', 'data-corners') === 'round' ? '3% / ' + (3 * s.w / s.h) + '%' : '2px';
    var dot = function (x, y) { return '<span style="position:absolute;' + x + ';' + y + ';width:3.2%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 40%,#F2F2F2,#6B7280);box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)"></span>'; };
    holes.innerHTML = picked('fixing', 'data-holes') === '1' ? dot('left:3.5%', 'top:' + (3.5 * s.w / s.h) + '%') + dot('right:3.5%', 'top:' + (3.5 * s.w / s.h) + '%') + dot('left:3.5%', 'bottom:' + (3.5 * s.w / s.h) + '%') + dot('right:3.5%', 'bottom:' + (3.5 * s.w / s.h) + '%') : '';

    // Emblem, then the largest text size that fits inside the margins.
    emblem.toggleAttribute('hidden', !e.svg); // SVG elements have no .hidden property
    if (e.svg) emblem.innerHTML = e.svg;
    text.textContent = wording.value.replace(/^\n+|\n+$/g, '');
    text.style.fontFamily = f.fam; text.style.fontStyle = f.fstyle;
    var scale = parseFloat(f.fsize) / 1.35;
    var hi = inner.clientHeight / Math.max(lines.length + (e.svg ? 1.4 : 0), 1) / 1.3;
    var px = Math.min(hi, inner.clientWidth / 9) * scale;
    for (var i = 0; i < 40; i++) {
      text.style.fontSize = px + 'px';
      emblem.style.width = emblem.style.height = (px / scale) * 1.4 + 'px';
      if (inner.scrollHeight <= inner.clientHeight + 1 && text.scrollWidth <= inner.clientWidth + 1) break;
      px *= 0.93;
    }

    // Plain-English guide to whether the wording suits the size.
    var advice = '';
    if (sid === 'other') advice = 'Tell us the size in the notes, or send a photo of the plaque you want to match.';
    else if (!lines.length) advice = 'Type your wording to see it on the plaque.';
    else if (lines.length > s.lines || longest > s.chars) {
      var better = data.sizes.filter(function (x) { return x.lines >= lines.length && x.chars >= longest; })[0];
      advice = 'That’s a lot of wording for ' + s.name + ', so the letters will be small. ' + (better ? 'Try ' + better.name + ', or shorten a line or two.' : 'Try shortening it, or we’ll suggest a layout on your proof.');
    } else advice = 'Good fit: ' + lines.length + (lines.length === 1 ? ' line' : ' lines') + ' suits ' + (s.name.charAt(0) === '8' ? 'an ' : 'a ') + s.name + ' plaque (up to about ' + s.lines + ').';
    fit.textContent = advice;

    var o = form.elements;
    summary.value = [o.quantity.value + ' × ' + o.material.value + ' bench plaque', o.size.value, 'Font: ' + o.font.value, 'Emblem: ' + o.emblem.value, 'Corners: ' + o.corners.value, 'Border: ' + o.border.value, 'Fixing: ' + o.fixing.value].join(' · ');
    document.getElementById('pq-own').hidden = e.id !== 'own';
    document.getElementById('pq-council').hidden = o.bench_location.value.indexOf('Council') !== 0;
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  window.addEventListener('resize', render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
})();
