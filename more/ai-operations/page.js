/* MORE. sales-page template
   Change the offer by editing index.html.
   BOOKING_URL  — href for every "Book a Conversation" control.
   VSL_EMBED    — "" keeps the poster. Set a video file (.mp4, .webm, .ogg)
                  or an embed URL (YouTube, Vimeo, Loom, or an iframe src).
                  Autoplay is forced off. File videos load VSL_CAPTIONS. */

const BOOKING_URL = 'tel:+19348990796';
const VSL_EMBED = '';
const VSL_CAPTIONS = '/more/ai-operations/captions.vtt';

(function () {
  var links = document.querySelectorAll('[data-booking]');
  for (var i = 0; i < links.length; i++) {
    links[i].href = BOOKING_URL;
    if (/^https?:/i.test(BOOKING_URL)) {
      links[i].target = '_blank';
      links[i].rel = 'noopener noreferrer';
    }
  }

  var slot = document.getElementById('vsl');
  var poster = slot && slot.querySelector('.poster');
  var src = resolveEmbed(VSL_EMBED);
  if (slot && poster && src) mountVideo(slot, poster, src);

  var dock = document.querySelector('.dock');
  var anchors = [document.querySelector('.hero .cta'), document.getElementById('book')].filter(Boolean);
  if (dock && anchors.length && 'IntersectionObserver' in window) {
    var visible = new Set();
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      var hide = visible.size > 0;
      dock.classList.toggle('is-hidden', hide);
      dock.setAttribute('aria-hidden', hide ? 'true' : 'false');
      var link = dock.querySelector('a');
      if (link) link.tabIndex = hide ? -1 : 0;
    }, { threshold: 0.15 });
    anchors.forEach(function (el) { watcher.observe(el); });
  }
})();

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
    video.setAttribute('aria-label', 'Team AI Implementation video');
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
  frame.title = 'Team AI Implementation video';
  frame.allowFullscreen = true;
  frame.setAttribute('allow', 'fullscreen; picture-in-picture');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  frame.loading = 'lazy';
  slot.appendChild(frame);
}
