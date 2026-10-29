/* Priority and board shape for the MORE. pipeline.
   Low / Medium / High only. "Hot" (and anything else) is ignored and
   remapped with the name rules. A real Low, Medium, or High on a lead
   is kept. Records come from the authenticated /api/crm response. */
(function (factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.CRMModel = api;
})(function () {
  'use strict';

  var HIGH = {
    'east hampton fence & gate': 1,
    'steves east end fuel': 1,
    'sparkling pools': 1
  };
  var MEDIUM_NAMES = {
    'hoyt property care': 1,
    'whites lumber & millwork': 1
  };
  var RANK = { High: 0, Medium: 1, Low: 2 };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function normName(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u2019\u2018']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function slug(s) {
    return normName(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function priorityFromRules(lead) {
    var name = normName(lead && lead.name);
    if (HIGH[name]) return 'High';
    if (MEDIUM_NAMES[name]) return 'Medium';
    if (name === 'hvac 4 service' && /in progress/i.test((lead && lead.stage) || '')) return 'Medium';
    return 'Low';
  }

  function canonPriority(lead) {
    var raw = String((lead && lead.priority) || '').trim().toLowerCase();
    if (raw === 'low' || raw === 'medium' || raw === 'high') {
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return priorityFromRules(lead || {});
  }

  function formatAsOf(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    return MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]) + ', ' + m[1];
  }

function cleanContact(c) {
  var t = String(c || '').trim();
  if (!t || t === '-' || t === '\u2014' || t === '\u2013') return '';
  return t;
}

function text(v) {
  return String(v || '').trim();
}

function geoOf(item) {
  var lat = item && item.lat;
  var lng = item && item.lng;
  var latN = Number(lat);
  var lngN = Number(lng);
  var ok = lat != null && lng != null && String(lat) !== '' && String(lng) !== '' && isFinite(latN) && isFinite(lngN);
  return {
    email: text(item && item.email),
    address: text(item && item.address),
    town: text(item && item.town),
    lat: ok ? latN : null,
    lng: ok ? lngN : null
  };
}

function kmBetween(a, b) {
  var r = 6371;
  var dLat = (b.lat - a.lat) * Math.PI / 180;
  var dLng = (b.lng - a.lng) * Math.PI / 180;
  var lat1 = a.lat * Math.PI / 180;
  var lat2 = b.lat * Math.PI / 180;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function clusterPlaces(places, withinKm) {
  var limit = withinKm == null ? 1 : withinKm;
  var groups = [];
  var used = {};
  (places || []).forEach(function (place) {
    if (!place || used[place.id] || place.lat == null || place.lng == null) return;
    var group = [place];
    used[place.id] = 1;
    var grew = true;
    while (grew) {
      grew = false;
      (places || []).forEach(function (other) {
        if (!other || used[other.id] || other.lat == null || other.lng == null) return;
        var near = false;
        var i;
        for (i = 0; i < group.length; i += 1) {
          if (kmBetween(group[i], other) <= limit) { near = true; break; }
        }
        if (near) {
          group.push(other);
          used[other.id] = 1;
          grew = true;
        }
      });
    }
    groups.push(group);
  });
  groups.sort(function (a, b) { return b.length - a.length; });
  return groups;
}

  function present(data) {
    data = data || {};
    var seen = {};
    var leads = (data.leads || []).map(function (lead, i) {
      var priority = canonPriority(lead);
      var base = text(lead && lead.companyId) || slug(lead && lead.name) || ('lead-' + i);
      var id = base;
      if (seen[id]) id = base + '-' + i;
      seen[id] = 1;
      var step = text(lead && (lead.nextStep || lead.next));
      var geo = geoOf(lead);
      return {
        id: id,
        kind: 'lead',
        order: i,
        priority: priority,
        name: (lead && lead.name) || 'Untitled',
        trade: (lead && lead.trade) || '',
        contact: cleanContact(lead && lead.contact),
        stage: (lead && lead.stage) || '',
        action: step,
        nextStep: step,
        phone: text(lead && lead.phone),
        email: geo.email,
        address: geo.address,
        town: geo.town,
        lat: geo.lat,
        lng: geo.lng
      };
    });

    var ordered = leads.slice().sort(function (a, b) {
      return (RANK[a.priority] - RANK[b.priority]) || (a.order - b.order);
    });

    var queue = ordered.filter(function (lead) {
      return lead.priority === 'High' || lead.priority === 'Medium';
    });

    var stops = [];
    (data.visitToday || []).forEach(function (visit, i) {
      var base = text(visit && visit.companyId) || 'visit-' + (slug(visit && visit.name) || String(i));
      var id = base;
      if (seen[id]) id = base + '-' + i;
      seen[id] = 1;
      var step = text(visit && (visit.nextStep || visit.action));
      var geo = geoOf(visit);
      var stop = {
        id: id,
        companyId: text(visit && visit.companyId),
        kind: 'visit',
        order: 1000 + i,
        priority: 'Visit',
        name: (visit && visit.name) || 'Visit',
        trade: (visit && visit.trade) || '',
        contact: cleanContact(visit && visit.contact),
        stage: 'Cold visit today',
        action: step,
        nextStep: step,
        phone: text(visit && visit.phone),
        email: geo.email,
        address: geo.address,
        town: geo.town,
        lat: geo.lat,
        lng: geo.lng
      };
      stops.push(stop);
      queue.push(stop);
    });

    var face = num(data.faceConversations);
    var faceTarget = num(data.faceTarget) || 100;
    var hunt = (data.gaps || []).map(function (gap) {
      return {
        trade: (gap && gap.trade) || '',
        cold: num(gap && gap.cold),
        pct: num(gap && gap.pct)
      };
    }).sort(function (a, b) {
      return (b.cold - a.cold) || a.trade.localeCompare(b.trade);
    });

    function count(priority) {
      var n = 0;
      leads.forEach(function (lead) { if (lead.priority === priority) n += 1; });
      return n;
    }

    var places = ordered.concat(stops).filter(function (item) {
      return item.lat != null && item.lng != null;
    }).map(function (item) {
      return {
        id: item.id,
        name: item.name,
        priority: item.priority,
        kind: item.kind,
        address: item.address,
        town: item.town,
        lat: item.lat,
        lng: item.lng
      };
    });

    var board = {
      asOf: data.asOf || '',
      asOfLabel: formatAsOf(data.asOf),
      centerLabel: text(data.centerLabel) || 'Cold door knocks',
      priorityRules: data.priorityRules || 'Low, Medium, and High only.',
      counts: {
        face: face,
        faceTarget: faceTarget,
        facePct: faceTarget ? Math.round((face / faceTarget) * 100) : 0,
        label: text(data.centerLabel) || 'Cold door knocks',
        meetings: num(data.meetings),
        closes: num(data.closes),
        high: count('High'),
        medium: count('Medium'),
        low: count('Low'),
        total: leads.length
      },
      leads: ordered,
      stops: stops,
      queue: queue,
      places: places,
      hunt: hunt
    };
    var daily = typeof module === 'object' && module.exports ? require('./daily-model.js') : window.DailyModel;
    return daily.enhance(board, data);
  }

  return { present: present, canonPriority: canonPriority, clusterPlaces: clusterPlaces };
});
