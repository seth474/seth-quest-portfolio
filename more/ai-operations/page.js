/* MORE. sales-page template
   Change the offer by editing index.html.
   BOOKING_URL     — Zoom or calendar link. "" keeps #book.
   SIGNUP_URL      — endpoint for the weekly-video form. "" keeps the placeholder.
   BUY_COURSE_URL  — checkout link for the $480 course. "" keeps #course.
   VSL_EMBED    — "" keeps the poster. Set a video file (.mp4, .webm, .ogg)
                  or an embed URL (YouTube, Vimeo, Loom, or an iframe src).
                  Autoplay is forced off. File videos load VSL_CAPTIONS. */

const BOOKING_URL = '';
const SIGNUP_URL = '';
const BUY_COURSE_URL = '';
const VSL_EMBED = '';
const VSL_CAPTIONS = '/more/ai-operations/captions.vtt';

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
      var note = form.querySelector('[data-signup-note]');
      if (!SIGNUP_URL) {
        event.preventDefault();
        if (note) note.hidden = false;
        return;
      }
      form.action = SIGNUP_URL;
    });
  }

  var slot = document.getElementById('vsl');
  var poster = slot && slot.querySelector('.poster');
  var src = resolveEmbed(VSL_EMBED);
  if (slot && poster && src) mountVideo(slot, poster, src);

  var watches = document.querySelectorAll('[data-watch]');
  for (var w = 0; w < watches.length; w++) {
    watches[w].addEventListener('click', function (event) {
      var film = document.getElementById('vsl');
      var video = film && film.querySelector('video');
      if (!film || !video) return;
      event.preventDefault();
      film.scrollIntoView({ behavior: 'smooth', block: 'center' });
      video.play();
    });
  }

  revealOnScroll();
})();

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
