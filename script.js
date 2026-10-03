/* Five behaviours, no library, ~4KB.
   Every one is progressive enhancement: with JS off the page is complete,
   fully readable and fully navigable. Nothing is hidden by CSS alone. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. theme, overriding either OS setting ───────────────────────── */
  var STORE = 'ik-theme';
  try {
    var saved = localStorage.getItem(STORE);
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  } catch (e) { /* private window */ }

  function isDark() {
    var set = root.getAttribute('data-theme');
    return set ? set === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    var sync = function () {
      themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    };
    sync();
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
      sync();
    });
  }

  /* ── 2. reveal on scroll ─────────────────────────────────────────── */
  var items = Array.prototype.slice.call(document.querySelectorAll('.r'));
  if (!reduced && 'IntersectionObserver' in window && items.length) {
    root.classList.add('js-reveal');           // only now does CSS hide anything
    items.forEach(function (el) {
      var hint = el.getAttribute('data-r');
      if (hint) el.style.setProperty('--d', (parseInt(hint, 10) - 1) * 80 + 'ms');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (!el.getAttribute('data-r')) {        // stagger siblings in a group
          var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
            return n.classList && n.classList.contains('r');
          });
          var i = sibs.indexOf(el);
          if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
        }
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
    // the opener should not wait for a scroll event
    requestAnimationFrame(function () {
      items.slice(0, 6).forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('in'); io.unobserve(el); }
      });
    });
  }

  /* ── 3. reading progress + sticky header shadow ───────────────────── */
  var bar = document.querySelector('#progress span');
  var mast = document.getElementById('masthead');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      if (mast) mast.classList.toggle('stuck', h.scrollTop > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 4. scroll-spy nav ───────────────────────────────────────────── */
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a[data-to]'));
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('data-to')); });
  if ('IntersectionObserver' in window && targets.filter(Boolean).length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = targets.indexOf(entry.target);
        if (i < 0) return;
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('here'); });
          links[i].classList.add('here');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { if (t) spy.observe(t); });
  }

  /* ── 5. the boundary reader ──────────────────────────────────────── */
  var BOUNDS = {
    spine: ['One party identity · one event stream · one set of financial facts',
      'No product is a module of another. They compose so a single organisation can run its ' +
      'commerce and its operations on the same spine, and the marketplace is tenant #1 of the ' +
      'ERP — onboarding through the same public path any other company would use.'],
    market: ['Marketplace — commerce only',
      'Discovery, offers, orders, returns, disputes, five selling models. It computes ' +
      'provisional money for gating a screen and owns none of it: every figure that has to ' +
      'reconcile belongs to the ERP. It knows nothing about payroll, projects or approvals.'],
    erp: ['ERP — the system of record',
      'A double-entry ledger with a per-tenant chart of accounts, people, approvals and ' +
      'reporting. Each customer gets their own database, reached through a connection string ' +
      'resolved per request, so no tenant address sits in any configuration file. An isolation ' +
      'failure refuses the request rather than falling back to shared data.'],
    console: ['Console engine — dashboards and actions as configuration',
      'Sold to anyone, and documented as six numbered obligations for any connecting system. ' +
      'The governing rule is that our own platform onboards through its public path: no branch ' +
      'keyed on our name, no endpoint only we can call. Finding one is a bug.'],
    msg: ['Messaging — owns no users, resolves nothing',
      'It stores and verifies no corporate password. An origin authenticates its own user and ' +
      'asserts the result over a signed request; party type, tenant and roles are opaque ' +
      'strings only the asserting origin can interpret.'],
    track: ['Tracking — custody, and the number is the credential',
      'The canonical shipment timeline, written by rule rows rather than code branches, so ' +
      'authorising a new party type means adding a row. Tracking numbers are generated from a ' +
      'CSPRNG and never sequential, which is why a wrong number and someone else’s number ' +
      'return the identical 404.']
  };

  var bBtns = Array.prototype.slice.call(document.querySelectorAll('.b-nodes button'));
  var bTitle = document.querySelector('.b-title');
  var bText = document.querySelector('.b-text');

  bBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-b');
      var copy = BOUNDS[key];
      if (!copy || !bTitle || !bText) return;
      bBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      bTitle.textContent = copy[0];
      bText.textContent = copy[1];
    });
  });

  /* ── 6. work filter ──────────────────────────────────────────────── */
  var fBtns = Array.prototype.slice.call(document.querySelectorAll('.filters button'));
  var cases = Array.prototype.slice.call(document.querySelectorAll('.case'));
  var count = document.getElementById('count');
  var LABEL = { all: '', platform: 'platform', ai: 'AI and agent', product: 'product' };

  function applyFilter(track) {
    var shown = 0;
    cases.forEach(function (el) {
      var match = track === 'all' ||
        (el.getAttribute('data-track') || '').split(/\s+/).indexOf(track) !== -1;
      el.hidden = !match;
      if (match) shown++;
    });
    fBtns.forEach(function (b) {
      var on = b.getAttribute('data-filter') === track;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (count) {
      count.textContent = track === 'all'
        ? shown + ' projects'
        : shown + ' of ' + cases.length + ' involve ' + LABEL[track] + ' work';
    }
  }
  fBtns.forEach(function (b) {
    b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
  });
  if (cases.length) applyFilter('all');

  /* ── 7. copy the email ───────────────────────────────────────────── */
  var copyBtn = document.getElementById('copy');
  var emailEl = document.getElementById('email');

  function flash(msg) {
    var was = copyBtn.textContent;
    copyBtn.textContent = msg;
    setTimeout(function () { copyBtn.textContent = was; }, 1600);
  }
  function selectEmail() {
    try {
      var r = document.createRange();
      r.selectNodeContents(emailEl);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      flash('Selected');
    } catch (e) { flash('Select it'); }
  }
  if (copyBtn && emailEl) {
    copyBtn.addEventListener('click', function () {
      var text = emailEl.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash('Copied'); }, selectEmail);
      } else { selectEmail(); }
    });
  }
})();
