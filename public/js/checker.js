// "Can I put a plaque on a bench?" – shows the result that matches the chosen option.
(function () {
  var root = document.getElementById('checker');
  if (!root) return;
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-pick]');
    if (!b) return;
    root.querySelectorAll('button[data-pick]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    root.querySelectorAll('[data-result]').forEach(function (r) { r.hidden = r.getAttribute('data-result') !== b.getAttribute('data-pick'); });
    var shown = root.querySelector('[data-result="' + b.getAttribute('data-pick') + '"]');
    if (shown && shown.scrollIntoView && window.innerWidth < 700) shown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
