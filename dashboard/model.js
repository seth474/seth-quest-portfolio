/* Priority and board shape for the MORE. pipeline.
   Low / Medium / High only. "Hot" (and anything else) is ignored and
   remapped with the name rules. A real Low, Medium, or High on a lead
   is kept, so editing dashboard/data.json is how the board changes. */
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

  function present(data) {
    data = data || {};
    var seen = {};
    var leads = (data.leads || []).map(function (lead, i) {
      var priority = canonPriority(lead);
      var base = slug(lead && lead.name) || ('lead-' + i);
      var id = base;
      if (seen[id]) id = base + '-' + i;
      seen[id] = 1;
      return {
        id: id,
        kind: 'lead',
        order: i,
        priority: priority,
        name: (lead && lead.name) || 'Untitled',
        trade: (lead && lead.trade) || '',
        contact: cleanContact(lead && lead.contact),
        stage: (lead && lead.stage) || '',
        action: (lead && lead.next) || '',
        phone: String((lead && lead.phone) || '').trim()
      };
    });

    var ordered = leads.slice().sort(function (a, b) {
      return (RANK[a.priority] - RANK[b.priority]) || (a.order - b.order);
    });

    var queue = ordered.filter(function (lead) {
      return lead.priority === 'High' || lead.priority === 'Medium';
    });

    (data.visitToday || []).forEach(function (visit, i) {
      var base = 'visit-' + (slug(visit && visit.name) || String(i));
      var id = base;
      if (seen[id]) id = base + '-' + i;
      seen[id] = 1;
      queue.push({
        id: id,
        kind: 'visit',
        order: 1000 + i,
        priority: 'Visit',
        name: (visit && visit.name) || 'Visit',
        trade: (visit && visit.trade) || '',
        contact: '',
        stage: 'Cold visit today',
        action: (visit && visit.action) || '',
        phone: ''
      });
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

    return {
      asOf: data.asOf || '',
      asOfLabel: formatAsOf(data.asOf),
      priorityRules: data.priorityRules || 'Low, Medium, and High only.',
      counts: {
        face: face,
        faceTarget: faceTarget,
        facePct: faceTarget ? Math.round((face / faceTarget) * 100) : 0,
        meetings: num(data.meetings),
        closes: num(data.closes),
        high: count('High'),
        medium: count('Medium'),
        low: count('Low'),
        total: leads.length
      },
      leads: ordered,
      queue: queue,
      hunt: hunt
    };
  }

  return { present: present, canonPriority: canonPriority };
});
