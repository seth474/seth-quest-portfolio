/* MORE. sales-page template
   Change the offer by editing index.html.
   BOOKING_URL     — Zoom or calendar link. "" keeps #book.
   SIGNUP_URL      — endpoint for the weekly-video form. "" keeps the placeholder.
   BUY_COURSE_URL  — checkout link for the $480 course. "" keeps #course.
   VSL_EMBED    — "" keeps the hero <video> already in the page.
                  A file or embed URL here replaces that player.
                  Autoplay stays off. Watch buttons play the hero with sound. */

const BOOKING_URL = '';
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

(function () {
  var links = document.querySelectorAll('[data-booking]');
  for (var i = 0; i < links.length; i++) {
    if (!BOOKING_URL) continue;
    links[i].href = BOOKING_URL;
    if (/^https?:/i.test(BOOKING_URL)) {
      links[i].target = '_blank';
      links[i].rel = 'noopener noreferrer';
    }
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
