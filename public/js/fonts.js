// Plaque font & wording preview.
(function () {
  var root = document.getElementById('font-tool');
  if (!root) return;
  var data = JSON.parse(document.getElementById('font-data').textContent);
  var text = document.getElementById('pf-text');
  var plate = document.getElementById('pf-plate');
  var out = document.getElementById('pf-out');
  var info = document.getElementById('pf-info');
  var size = document.getElementById('pf-size');
  var link = document.getElementById('pf-send');
  var state = { font: 'italic', mat: 'brass' };

  function suggest(lines, longest) {
    var n = lines;
    if (n <= 3 && longest <= 30) return '8 x 3"';
    if (n <= 5) return longest > 32 ? '10 x 5"' : '6 x 4"';
    if (n <= 6) return '7 x 5" or 10 x 5"';
    if (n <= 7) return '8 x 6"';
    return 'A4 (10.7 x 8.2")';
  }

  function render() {
    var f = data.fonts.filter(function (x) { return x.id === state.font; })[0];
    var m = data.mats.filter(function (x) { return x.id === state.mat; })[0];
    var lines = text.value.split('\n').filter(function (l) { return l.trim(); });
    var longest = lines.reduce(function (a, l) { return Math.max(a, l.length); }, 0);
    out.textContent = text.value;
    out.style.fontFamily = f.fam; out.style.fontStyle = f.fstyle; out.style.fontSize = f.fsize; out.style.color = m.ink;
    plate.style.background = m.bg; plate.style.borderColor = m.edge;
    info.textContent = lines.length + (lines.length === 1 ? ' line' : ' lines') + ', longest ' + longest + ' characters.';
    size.textContent = suggest(lines.length, longest);
    root.querySelectorAll('[data-font]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-font') === state.font)); });
    root.querySelectorAll('[data-mat]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mat') === state.mat)); });
    link.dataset.font = f.name; link.dataset.mat = m.name;
  }

  // Carry the wording to the quote form without putting it in the URL.
  link.addEventListener('click', function () {
    try { sessionStorage.setItem('plaque-preview', JSON.stringify({ wording: text.value, font: link.dataset.font, material: link.dataset.mat })); } catch (e) {}
  });

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.font) state.font = b.dataset.font;
    if (b.dataset.mat) state.mat = b.dataset.mat;
    render();
  });
  text.addEventListener('input', render);
  render();
})();
