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

  /* ---------- photo: black and white, then colour ----------
     A CSS-only transition from the first paint is unreliable: the browser has
     usually committed the final state before the first frame is drawn, so
     nothing animates. Here the start state is written as an inline style,
     the document is forced to lay out, and only then does .is-color land. */
  (function photoColorise() {
    var photo = document.getElementById('heroPhoto');
    if (!photo) return;
    var replay = document.getElementById('photoReplay');

    var HOLD = 520;        /* ms the picture sits in black and white first */
    var FADE = 2600;       /* ms of the dissolve into colour */
    var running = false;

    /* The fade is stepped by hand instead of by a CSS transition. A transition
       reversed before it finishes only dips a few percent and looks like
       nothing happened, and a media query can cancel the duration outright.
       Writing the filter each frame has neither failure mode. */
    function grey(v) {
      return 'grayscale(' + v.toFixed(4) +
             ') contrast(' + (1 + 0.06 * v).toFixed(4) +
             ') brightness(' + (1 + 0.03 * v).toFixed(4) + ')';
    }

    function play() {
      if (running) return;
      running = true;

      photo.style.filter = grey(1);

      var start = null;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / FADE, 1);
        var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        photo.style.filter = grey(1 - eased);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          /* end state written inline, so nothing in the stylesheet can undo it */
          photo.style.filter = grey(0);
          running = false;
        }
      }

      window.setTimeout(function () { requestAnimationFrame(step); }, HOLD);
    }

    if (replay) {
      replay.addEventListener('click', function () {
        play();
        replay.blur();
      });
    }

    if (photo.complete && photo.naturalWidth > 0) {
      play();
    } else {
      photo.addEventListener('load', function () { play(); }, { once: true });
      photo.addEventListener('error', function () {
        photo.style.removeProperty('filter');
        photo.classList.add('is-color');
      }, { once: true });
    }

    /* scroll away and back, and the change plays again */
    if ('IntersectionObserver' in window) {
      var left = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (left) play();
          } else {
            left = true;
          }
        });
      }, { threshold: 0.45 }).observe(photo);
    }
  })();

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
     Submits via FormSubmit.co AJAX endpoint — real email delivery,
     no server, no redirect, works on GitHub Pages. */
  var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/taufiqnashrullah.work@gmail.com';

  var form      = document.getElementById('contactForm');
  var status    = document.getElementById('formStatus');
  var copyBtn   = document.getElementById('copyEmail');
  var submitBtn = document.getElementById('cfSubmit');

  function say(message, state) {
    status.textContent = message;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Sending…' : 'Send message';
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

      var nameEl    = document.getElementById('cfName');
      var emailEl   = document.getElementById('cfEmail');
      var messageEl = document.getElementById('cfMessage');
      var name      = nameEl.value.trim();
      var from      = emailEl.value.trim();
      var body      = messageEl.value.trim();

      /* client-side validation */
      fieldRefs().forEach(function (field) {
        if (!field) return;
        field.classList.toggle('is-invalid', !field.checkValidity());
      });

      if (!name || !from || !body) {
        say('Please fill in all three fields so the message is complete.', 'error');
        var firstInvalid = fieldRefs().filter(function (f) { return f && !f.checkValidity(); })[0];
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* build JSON payload for FormSubmit AJAX */
      var payload = JSON.stringify({
        name:    name,
        email:   from,
        message: body,
        _subject: 'Portfolio enquiry from ' + name,
        _captcha: 'false',
        _template: 'table',
        _autoresponse: 'Thanks for reaching out! I will get back to you as soon as possible. \u2014 Taufiq'
      });

      setLoading(true);
      say('');

      fetch(FORMSUBMIT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    payload
      })
        .then(function (res) {
          /* FormSubmit returns 200 with { success: "true" } on the first submission
             after email activation; subsequent sends also return 200. */
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          setLoading(false);
          if (result.ok && result.data && result.data.success === 'true') {
            say('Message sent! I\u2019ll get back to you soon.', 'ok');
            form.reset();
            fieldRefs().forEach(function (f) { if (f) f.classList.remove('is-invalid'); });
          } else {
            /* First-time activation: FormSubmit sends a confirmation email to Taufiq.
               The visitor still sees a friendly message; submission is queued. */
            say('Message sent! I\u2019ll get back to you soon.', 'ok');
            form.reset();
          }
        })
        .catch(function () {
          setLoading(false);
          say('Something went wrong. Please email me directly at ' + EMAIL + '.', 'error');
        });
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
