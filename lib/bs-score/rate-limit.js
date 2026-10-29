/**
 * Small in-memory window. Each serverless instance keeps its own map,
 * which is enough to slow a script and is not a global lock.
 */

var hits = new Map();

function allow(key, limit, windowMs, now) {
  var time = now == null ? Date.now() : now;
  var name = String(key || "unknown");
  var recent = (hits.get(name) || []).filter(function (stamp) {
    return time - stamp < windowMs;
  });
  if (recent.length >= limit) {
    hits.set(name, recent);
    return false;
  }
  recent.push(time);
  hits.set(name, recent);
  return true;
}

function reset() {
  hits = new Map();
}

module.exports = {
  allow: allow,
  reset: reset
};
