// Shared behaviour: mobile menu, forms (Web3Forms with email-app fallback), earliest "needed by" date, font preview hand-off.
(function () {
  var EMAIL = 'info@grimesengravers.com';

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    var open = document.getElementById('site-nav').classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Build a mailto: link from a form, used when Web3Forms isn't set up or the send fails.
  function mailtoFrom(form) {
    var subject = (form.querySelector('[name="subject"]') || {}).value || 'Website enquiry';
    var lines = [];
    new FormData(form).forEach(function (v, k) {
      if (k === 'access_key' || k === 'subject' || !String(v).trim()) return;
      lines.push(k.replace(/[_-]/g, ' ') + ': ' + v);
    });
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  document.querySelectorAll('form[data-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.onBeforeSend === 'function') form.onBeforeSend();
      var status = form.querySelector('[data-status]');
      var btn = form.querySelector('[type="submit"]');
      var key = (form.querySelector('[name="access_key"]') || {}).value || '';
      if (!key || key.indexOf('REPLACE') !== -1) { window.location.href = mailtoFrom(form); return; }
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.success === false) throw new Error(); }); })
        .then(function () {
          form.reset();
          if (status) { status.hidden = false; status.className = 'status'; status.textContent = 'Thank you. We’ll reply with a quote within 24 hours (working days).'; }
          if (btn) btn.textContent = 'Sent';
        })
        .catch(function () {
          if (status) { status.hidden = false; status.className = 'status err'; status.innerHTML = 'Sorry, that didn’t send. <a href="' + mailtoFrom(form) + '">Send it by email instead</a>.'; }
          if (btn) { btn.disabled = false; btn.textContent = 'Try again'; }
        });
    });
  });

  // Contact form: prefill from the font preview tool (passed via sessionStorage, never the URL).
  var msg = document.getElementById('c-msg');
  if (msg) {
    try {
      var p = JSON.parse(sessionStorage.getItem('plaque-preview') || 'null');
      if (p) {
        msg.value = p.wording + '\n\nFont: ' + p.font + '\nMaterial: ' + p.material;
        var font = document.getElementById('c-font'); if (font) font.value = p.font;
        var type = document.getElementById('c-type'); if (type) type.value = 'Bench plaque';
        sessionStorage.removeItem('plaque-preview');
      }
    } catch (e) {}
  }

  // "Needed by" dates: block anything sooner than our lead time. Set here, not at build time, so it moves with today.
  document.querySelectorAll('input[type="date"][data-min-days]').forEach(function (inp) {
    var d = new Date();
    d.setDate(d.getDate() + parseInt(inp.dataset.minDays, 10));
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    inp.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  });
})();
