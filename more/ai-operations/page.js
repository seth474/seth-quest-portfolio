/* MORE. sales-page template
   Change the offer by editing index.html.
   BOOKING_URL     — kept for older links. The booking buttons open the modal.
   CALENDLY_URL    — inline calendar. "" shows a thanks line instead of the embed.
   SIGNUP_URL      — endpoint for the weekly-video form. "" keeps the placeholder.
   BUY_COURSE_URL  — checkout link for the $480 course. "" keeps #course.
   VSL_EMBED    — "" keeps the hero <video> already in the page.
                  A file or embed URL here replaces that player.
                  Autoplay stays off. Watch buttons play the hero with sound. */

const BOOKING_URL = '';
const CALENDLY_URL = '';
const SIGNUP_URL = '';
const BUY_COURSE_URL = '';
const VSL_EMBED = '';
const VSL_CAPTIONS = '/more/ai-operations/captions.vtt';
const SHOW_FUTURE_DEMOS = false;
/* 60-second vertical demos. Leave src empty until the file is ready.
   inbox: { src: '/more/ai-operations/inbox.mp4', poster: '/more/ai-operations/inbox.jpg' } */
const DEMO_VIDEOS = {
  inbox: { src: '', poster: '' },
  estimates: { src: '', poster: '' },
  files: { src: '', poster: '' }
};

function stayAtTop() {
  try { history.scrollRestoration = 'manual'; } catch (err) {}
  var root = document.documentElement;
  var prior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = prior;
}
stayAtTop();
window.addEventListener('pageshow', stayAtTop);
window.addEventListener('load', stayAtTop);

function stayAtTop() {
  try { history.scrollRestoration = 'manual'; } catch (err) {}
  var root = document.documentElement;
  var prior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = prior;
}
stayAtTop();
window.addEventListener('pageshow', stayAtTop);
window.addEventListener('load', stayAtTop);

function openBooking() {
  var modal = document.getElementById('book-modal');
  if (!modal || !modal.hidden) return;
  var sheet = modal.querySelector('.book-sheet');
  var step1 = modal.querySelector('[data-book-step="1"]');
  var step2 = modal.querySelector('[data-book-step="2"]');
  var title = document.getElementById('book-modal-title');
  var error = modal.querySelector('[data-book-error]');
  var thanks = modal.querySelector('[data-book-thanks]');
  var slot = modal.querySelector('[data-calendly]');
  var locked = window.scrollY || window.pageYOffset || 0;

  function focusable() {
    var nodes = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(nodes, function (el) {
      return !el.disabled && !el.hidden && el.offsetParent !== null;
    });
  }
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    var items = focusable();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function close() {
    modal.hidden = true;
    document.removeEventListener('keydown', onKey);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.classList.remove('book-lock');
    var root = document.documentElement;
    var prior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, locked);
    root.style.scrollBehavior = prior;
    step1.hidden = false;
    step2.hidden = true;
    if (error) error.hidden = true;
    if (thanks) thanks.hidden = true;
    if (slot) {
      slot.hidden = true;
      slot.innerHTML = '';
    }
    if (step1.reset) step1.reset();
  }
  function showThanks() {
    step1.hidden = true;
    step2.hidden = false;
    if (slot) slot.hidden = true;
    if (thanks) thanks.hidden = false;
    if (title) title.focus();
  }
  function mountCalendly(name, email) {
    step1.hidden = true;
    step2.hidden = false;
    if (thanks) thanks.hidden = true;
    if (slot) slot.hidden = false;
    function start() {
      if (!window.Calendly || !slot) {
        showThanks();
        return;
      }
      slot.innerHTML = '';
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: slot,
        prefill: { name: name, email: email }
      });
      if (title) title.focus();
    }
    if (window.Calendly) {
      start();
      return;
    }
    var script = document.querySelector('script[data-calendly]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.setAttribute('data-calendly', '');
      script.onerror = showThanks;
      document.head.appendChild(script);
    }
    script.addEventListener('load', start, { once: true });
  }
  var closers = modal.querySelectorAll('[data-book-close]');
  for (var c = 0; c < closers.length; c++) {
    closers[c].onclick = close;
  }
  step1.onsubmit = function (event) {
    event.preventDefault();
    var nameInput = step1.querySelector('[name="name"]');
    var emailInput = step1.querySelector('[name="email"]');
    var name = nameInput ? nameInput.value.replace(/^\s+|\s+$/g, '') : '';
    var email = emailInput ? emailInput.value.replace(/^\s+|\s+$/g, '') : '';
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailOk) {
      if (error) error.hidden = false;
      if (!name && nameInput) nameInput.focus();
      else if (emailInput) emailInput.focus();
      return;
    }
    if (error) error.hidden = true;
    if (SIGNUP_URL) {
      var payload = new FormData();
      payload.append('name', name);
      payload.append('email', email);
      payload.append('source', 'booking');
      fetch(SIGNUP_URL, { method: 'POST', body: payload }).catch(function () {});
    }
    if (!CALENDLY_URL) showThanks();
    else mountCalendly(name, email);
  };

  document.body.style.top = '-' + locked + 'px';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.documentElement.classList.add('book-lock');
  modal.hidden = false;
  document.addEventListener('keydown', onKey);
  var nameField = step1.querySelector('[name="name"]');
  if (nameField) nameField.focus();
}

(function () {
  var links = document.querySelectorAll('[data-booking]');
  for (var i = 0; i < links.length; i++) {
    if (BOOKING_URL) {
      links[i].href = BOOKING_URL;
      if (/^https?:/i.test(BOOKING_URL)) {
        links[i].target = '_blank';
        links[i].rel = 'noopener noreferrer';
      }
    }
    links[i].addEventListener('click', function (event) {
      event.preventDefault();
      openBooking();
    });
  }

  var buy = document.querySelector('[data-buy]');
  if (buy && BUY_COURSE_URL) {
    buy.href = BUY_COURSE_URL;
    if (/^https?:/i.test(BUY_COURSE_URL)) {
      buy.target = '_blank';
      buy.rel = 'noopener noreferrer';
    }
  }

  var form = document.querySelector('[data-signup]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var thanks = form.querySelector('[data-signup-thanks]');
      var note = form.querySelector('[data-signup-note]');
      function showThanks() {
        form.classList.add('is-sent');
        if (thanks) thanks.hidden = false;
      }
      if (!SIGNUP_URL) {
        if (note) note.hidden = false;
        showThanks();
        return;
      }
      fetch(SIGNUP_URL, { method: 'POST', body: new FormData(form) })
        .then(function (res) {
          if (!res.ok) throw new Error('signup failed');
          showThanks();
        })
        .catch(function () {
          if (note) {
            note.hidden = false;
            note.textContent = "That didn't send. Try again in a moment.";
          }
        });
    });
  }

  var slot = document.getElementById('vsl');
  var poster = slot && slot.querySelector('.poster');
  var src = resolveEmbed(VSL_EMBED);
  if (slot && poster && src && !slot.querySelector('video')) mountVideo(slot, poster, src);

  var watches = document.querySelectorAll('[data-watch]');
  for (var w = 0; w < watches.length; w++) {
    watches[w].addEventListener('click', function (event) {
      var film = document.getElementById('vsl');
      var video = film && film.querySelector('video');
      if (!film || !video) return;
      event.preventDefault();
      var reduce = document.documentElement.classList.contains('reduce');
      video.muted = false;
      video.volume = 1;
      if (!enterMobileFullscreen(video)) {
        film.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
      var started = video.play();
      if (started && typeof started.catch === 'function') started.catch(function () {});
    });
  }

  var heroVideo = document.querySelector('#vsl video');
  if (heroVideo) trackHeroVideo(heroVideo);

  if (SHOW_FUTURE_DEMOS) {
    var future = document.querySelectorAll('[data-future-demos]');
    for (var f = 0; f < future.length; f++) future[f].hidden = false;
  }
  var demos = document.querySelectorAll('[data-demo]');
  for (var d = 0; d < demos.length; d++) {
    var key = demos[d].getAttribute('data-demo');
    var clip = DEMO_VIDEOS[key];
    if (!clip || !clip.src) continue;
    var demoVideo = demos[d].querySelector('video');
    var demoPoster = demos[d].querySelector('.poster');
    if (!demoVideo) continue;
    if (clip.poster) demoVideo.poster = clip.poster;
    demoVideo.src = clip.src;
    demoVideo.hidden = false;
    if (demoPoster) demoPoster.hidden = true;
  }

  revealOnScroll();
})();

function wantsMobileFullscreen() {
  return window.matchMedia('(pointer: coarse) and (max-width: 768px)').matches;
}

function videoInFullscreen(video) {
  if (document.fullscreenElement) return true;
  return !!(video && video.webkitDisplayingFullscreen);
}

var heroFullscreenEntering = false;

function enterMobileFullscreen(video) {
  if (!video || !wantsMobileFullscreen() || videoInFullscreen(video) || heroFullscreenEntering) return false;
  try {
    if (typeof video.webkitEnterFullscreen === 'function') {
      heroFullscreenEntering = true;
      video.webkitEnterFullscreen();
      requestAnimationFrame(function () {
        if (!videoInFullscreen(video)) heroFullscreenEntering = false;
      });
      return true;
    }
    if (typeof video.requestFullscreen === 'function') {
      heroFullscreenEntering = true;
      var pending = video.requestFullscreen();
      if (pending && typeof pending.then === 'function') {
        pending.then(function () {}, function () { heroFullscreenEntering = false; });
      }
      return true;
    }
  } catch (err) {
    heroFullscreenEntering = false;
  }
  return false;
}

function exitMobileFullscreen(video) {
  var attempted = false;
  try {
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      attempted = true;
      var pending = document.exitFullscreen();
      if (pending && typeof pending.catch === 'function') pending.catch(function () {});
    }
  } catch (err) {}
  try {
    if (video && video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === 'function') {
      attempted = true;
      video.webkitExitFullscreen();
    }
  } catch (err) {}
  return attempted;
}

function trackHeroVideo(video) {
  var bar = document.querySelector('[data-vsl-progress]');
  var fill = bar && bar.firstElementChild;
  var book = document.querySelector('[data-vsl-book]');
  if (!bar || !fill) return;
  var reduce = document.documentElement.classList.contains('reduce');
  var frame = 0;
  var running = false;
  var resumeInline = false;
  var inlineUntil = 0;
  var scrolledForEnd = false;
  var userPlayed = false;
  var endedAfterUserPlay = false;

  function scrollWhenInline() {
    function onLeave() {
      if (videoInFullscreen(video)) return;
      document.removeEventListener('fullscreenchange', onLeave);
      video.removeEventListener('webkitendfullscreen', onLeave);
      scrollEndedIntoView();
    }
    if (videoInFullscreen(video)) {
      document.addEventListener('fullscreenchange', onLeave);
      video.addEventListener('webkitendfullscreen', onLeave);
      return;
    }
    scrollEndedIntoView();
  }
  function scrollEndedIntoView() {
    if (!endedAfterUserPlay || scrolledForEnd || !wantsMobileFullscreen()) return;
    scrolledForEnd = true;
    var film = document.getElementById('vsl');
    if (!film) return;
    var bottom = film.getBoundingClientRect().bottom;
    if (book) bottom = Math.max(bottom, book.getBoundingClientRect().bottom);
    var delta = bottom - window.innerHeight + 24;
    if (Math.abs(delta) < 2) return;
    var behavior = reduce ? 'auto' : 'smooth';
    try {
      window.scrollBy({ top: delta, left: 0, behavior: behavior });
    } catch (err) {
      window.scrollBy(0, delta);
    }
  }
  function revealBook() {
    if (!book) return;
    book.hidden = false;
    if (reduce) {
      book.classList.add('is-in');
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        book.classList.add('is-in');
      });
    });
  }
  function onFullscreenExit() {
    heroFullscreenEntering = false;
    if (!userPlayed || endedAfterUserPlay) return;
    inlineUntil = Date.now() + 800;
    if (!video.paused) return;
    resumeInline = true;
    var started = video.play();
    if (started && typeof started.catch === 'function') {
      started.catch(function () { resumeInline = false; });
    }
  }

  function ratio() {
    var dur = video.duration;
    if (!dur || !isFinite(dur)) return 0;
    return Math.min(1, Math.max(0, video.currentTime / dur));
  }
  function paint() {
    fill.style.transform = 'scaleX(' + ratio().toFixed(4) + ')';
  }
  function loop() {
    paint();
    if (!running) return;
    frame = requestAnimationFrame(loop);
  }
  function startLoop() {
    if (reduce) {
      paint();
      return;
    }
    if (running) return;
    running = true;
    loop();
  }
  function stopLoop() {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    paint();
  }

  video.addEventListener('timeupdate', paint);
  video.addEventListener('play', function () {
    bar.hidden = false;
    bar.classList.add('is-on');
    bar.classList.remove('is-done');
    scrolledForEnd = false;
    startLoop();
    if (resumeInline || Date.now() < inlineUntil) {
      resumeInline = false;
      return;
    }
    userPlayed = true;
    enterMobileFullscreen(video);
  });
  video.addEventListener('pause', stopLoop);
  video.addEventListener('seeked', paint);
  video.addEventListener('ended', function () {
    stopLoop();
    if (!userPlayed) return;
    endedAfterUserPlay = true;
    fill.style.transform = 'scaleX(1)';
    bar.classList.remove('is-on');
    bar.classList.add('is-done');
    revealBook();
    exitMobileFullscreen(video);
    scrollWhenInline();
  });
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) {
      heroFullscreenEntering = false;
      return;
    }
    onFullscreenExit();
  });
  video.addEventListener('webkitbeginfullscreen', function () {
    heroFullscreenEntering = false;
  });
  video.addEventListener('webkitendfullscreen', onFullscreenExit);
}

function revealOnScroll() {
  var nodes = document.querySelectorAll('[data-reveal]');
  var reduce = document.documentElement.classList.contains('reduce');
  if (reduce || !('IntersectionObserver' in window)) {
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('is-in');
    return;
  }
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      watcher.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 8% 0px' });
  for (var n = 0; n < nodes.length; n++) {
    var el = nodes[n];
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) el.classList.add('is-in');
    else watcher.observe(el);
  }
}

function resolveEmbed(raw) {
  var value = String(raw || '').trim();
  if (!value) return '';
  var fromIframe = value.match(/src\s*=\s*["']([^"']+)["']/i);
  if (fromIframe) value = fromIframe[1].trim();
  if (/^(javascript|data):/i.test(value)) return '';
  if (value.charAt(0) === '/') return value;
  if (!/^https?:\/\//i.test(value)) return '';
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(value)) return stripAutoplay(value);
  try {
    var url = new URL(value);
    var host = url.hostname.replace(/^www\./, '');
    var path = url.pathname;
    if (host === 'youtu.be' && path.length > 1) {
      url = new URL('https://www.youtube.com/embed/' + decodeURIComponent(path.slice(1)));
    } else if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') && path === '/watch' && url.searchParams.get('v')) {
      url = new URL('https://www.youtube.com/embed/' + url.searchParams.get('v'));
    } else if (host === 'vimeo.com' && /^\/\d+/.test(path)) {
      url = new URL('https://player.vimeo.com/video' + path);
    } else if (host === 'loom.com' && /^\/share\//.test(path)) {
      url = new URL('https://www.loom.com/embed/' + path.split('/')[2]);
    }
    url.searchParams.delete('autoplay');
    url.searchParams.set('autoplay', '0');
    if (/youtube/.test(url.hostname)) url.searchParams.set('rel', '0');
    return url.toString();
  } catch (err) {
    return '';
  }
}

function stripAutoplay(value) {
  try {
    var url = new URL(value, 'https://sethquest.com');
    url.searchParams.delete('autoplay');
    if (value.charAt(0) === '/') return url.pathname + url.search + url.hash;
    return url.toString();
  } catch (err) {
    return value.replace(/([?&])autoplay=1\b/i, '$1autoplay=0');
  }
}

function mountVideo(slot, poster, src) {
  poster.hidden = true;
  slot.classList.add('has-media');
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(src)) {
    var video = document.createElement('video');
    video.controls = true;
    video.autoplay = false;
    video.preload = 'metadata';
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'Seth on camera');
    var source = document.createElement('source');
    source.src = src;
    source.type = /\.webm(\?|#|$)/i.test(src) ? 'video/webm' : /\.ogg(\?|#|$)/i.test(src) ? 'video/ogg' : 'video/mp4';
    video.appendChild(source);
    var track = document.createElement('track');
    track.kind = 'captions';
    track.label = 'English';
    track.srclang = 'en';
    track.src = VSL_CAPTIONS;
    video.appendChild(track);
    slot.appendChild(video);
    return;
  }
  var frame = document.createElement('iframe');
  frame.src = src;
  frame.title = 'Seth on camera';
  frame.allowFullscreen = true;
  frame.setAttribute('allow', 'fullscreen; picture-in-picture');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  frame.loading = 'lazy';
  slot.appendChild(frame);
}
