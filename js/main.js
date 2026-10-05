/* Taufiq Nashrullah - portfolio behaviour.
   No dependencies, no build step: works straight from the file system. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = 'taufiqnashrullah.work@gmail.com';

  /* ---------- sticky header + reading progress ---------- */
  var head = document.getElementById('siteHead');
  var bar = document.getElementById('progressBar');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      head.classList.toggle('is-scrolled', y > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- hero title entrance ---------- */
  var hero = document.querySelector('.hero');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { hero.classList.add('is-ready'); });
  });

  /* ---------- scroll reveals ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- portrait lens ----------
     The reveal sits on a moving mask, so the interaction needs no canvas:
     a pointer position and an inner radius are written to CSS variables. */
  var figure = document.getElementById('lensFigure');
  var lens = document.getElementById('lensLayer');

  if (figure && lens) {
    var stack = figure.querySelector('.hero__stack');
    var hint = document.getElementById('lensHint');
    var used = false;

    function sizeLens() {
      var w = stack.clientWidth || 360;
      stack.style.setProperty('--r', Math.max(52, Math.round(w * 0.2)) + 'px');
    }
    sizeLens();
    window.addEventListener('resize', sizeLens);

    if (!reduced) {
      stack.addEventListener('pointermove', function (event) {
        if (event.pointerType === 'touch') return;
        var rect = stack.getBoundingClientRect();
        var x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        var y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        stack.style.setProperty('--mx', (x / rect.width * 100).toFixed(2) + '%');
        stack.style.setProperty('--my', (y / rect.height * 100).toFixed(2) + '%');
        if (!used) {
          used = true;
          lens.classList.remove('is-idle');
          figure.classList.add('is-used');
          if (hint) hint.textContent = 'Lens follows your pointer';
          stack.style.setProperty('--r', Math.max(72, Math.round(rect.width * 0.26)) + 'px');
        }
      });

      stack.addEventListener('pointerleave', function () {
        var rect = stack.getBoundingClientRect();
        stack.style.setProperty('--mx', '50%');
        stack.style.setProperty('--my', '14%');
        stack.style.setProperty('--r', Math.max(52, Math.round(rect.width * 0.2)) + 'px');
        if (used) {
          lens.classList.add('is-idle');
          if (hint) hint.textContent = 'Move your pointer over the frame';
        }
      });
    }
  }

  /* ---------- local time in Vlotho ---------- */
  var clock = document.getElementById('clockTime');
  if (clock) {
    var timeFmt;
    try {
      timeFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch (err) {
      timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    var stamp = function () {
      var now = new Date();
      clock.textContent = timeFmt.format(now);
      clock.setAttribute('datetime', now.toISOString());
    };
    stamp();
    setInterval(stamp, 20000);
  }

  /* ---------- drawer ---------- */
  var drawer = document.getElementById('drawer');
  var openBtn = document.getElementById('menuOpen');
  var closeBtn = document.getElementById('menuClose');
  var lastFocused = null;

  function openDrawer() {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
    document.addEventListener('keydown', drawerKey);
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', drawerKey);
    window.setTimeout(function () { drawer.hidden = true; }, reduced ? 0 : 380);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function drawerKey(event) {
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = drawer.querySelectorAll('a[href], button:not([disabled])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (drawer && openBtn && closeBtn) {
    openBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });
    drawer.querySelectorAll('.drawer__nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.classList.remove('is-open');
        openBtn.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
        document.removeEventListener('keydown', drawerKey);
        window.setTimeout(function () { drawer.hidden = true; }, reduced ? 0 : 380);
      });
    });
  }

  /* ---------- contact form ----------
     A static page cannot post anywhere, so the form hands the message to the
     visitor's mail client. Stated in the UI, not hidden behind a silent no-op. */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var copyBtn = document.getElementById('copyEmail');

  function say(message, state) {
    status.textContent = message;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  }

  /* The form is novalidate on purpose: the message below is the one piece of
     feedback the visitor sees, so it is written here instead of a browser bubble. */
  function fieldRefs() {
    return [
      document.getElementById('cfName'),
      document.getElementById('cfEmail'),
      document.getElementById('cfMessage')
    ];
  }

  function clearInvalid(field) {
    if (field) field.classList.remove('is-invalid');
  }

  fieldRefs().forEach(function (field) {
    if (!field) return;
    field.addEventListener('input', function () { clearInvalid(field); });
  });

  if (form && status) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = document.getElementById('cfName').value.trim();
      var from = document.getElementById('cfEmail').value.trim();
      var body = document.getElementById('cfMessage').value.trim();

      fieldRefs().forEach(function (field) {
        if (!field) return;
        field.classList.toggle('is-invalid', !field.checkValidity());
      });

      if (!name || !from || !body) {
        say('Please fill in all three fields so the message is complete.', 'error');
        var firstEmpty = fieldRefs().filter(function (field) { return field && !field.checkValidity(); })[0];
        if (firstEmpty) firstEmpty.focus();
        return;
      }

      var subject = 'Portfolio enquiry from ' + name;
      var text = body + '\n\n' + name + '\n' + from;
      window.location.href = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(text);
      say('Opening your mail app now. If nothing opened, use the copy button instead.');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var done = function () { say('Email address copied.'); };
      var failed = function () { say('Copy blocked by the browser. The address is ' + EMAIL, 'error'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(done, failed);
      } else {
        var field = document.createElement('textarea');
        field.value = EMAIL;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        try { document.execCommand('copy'); done(); } catch (err) { failed(); }
        document.body.removeChild(field);
      }
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
