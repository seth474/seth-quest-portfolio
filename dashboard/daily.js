(function () {
  'use strict';
  var board, openLead, sheet, body, title, returnFocus, timer;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function cash(n) { return n == null ? 'Unconfirmed' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }
  function note(text, cls) { body.appendChild(el('p', cls || 'detail-note', text)); }
  function heading(text) { body.appendChild(el('h3', 'detail-heading', text)); }
  function button(text, callback, cls) { var b = el('button', cls || 'browse-row', text); b.type = 'button'; b.addEventListener('click', callback); return b; }
  function record(row, kind) {
    var card = el('article', 'history-card');
    card.appendChild(el('h3', '', row.name || row.companyName || row.companyId));
    card.appendChild(el('p', 'history-meta', (row.date || 'Date not recorded') + ' · ' + (row.status || row.outcome || kind)));
    if (row.contact) card.appendChild(el('p', '', row.contact));
    if (row.notes) card.appendChild(el('p', 'history-notes', row.notes));
    if (row.source) {
      var url; try { url = new URL(row.source); } catch (_) {}
      if (url && url.protocol === 'https:') { var a = el('a', 'source-link', 'View source record'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.appendChild(a); }
      else card.appendChild(el('p', 'history-meta', 'Source: ' + row.source));
    }
    body.appendChild(card);
  }
  function ensureSheet() {
    if (sheet) return;
    sheet = el('section', 'sheet daily-sheet'); sheet.id = 'sheet-daily'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'daily-title');
    var bar = el('header', 'sheet-bar');
    bar.appendChild(button('Close', close, 'sheet-x'));
    title = el('h2', '', 'Details'); title.id = 'daily-title'; bar.appendChild(title);
    sheet.appendChild(bar); body = el('div', 'sheet-scroll daily-body'); sheet.appendChild(body);
    document.getElementById('app').appendChild(sheet);
  }
  function show(name) { ensureSheet(); if (sheet.hidden) returnFocus = document.activeElement; title.textContent = name; clear(body); sheet.hidden = false; body.scrollTop = 0; sheet.querySelector('button').focus(); }
  function close() { if (!sheet) return; sheet.hidden = true; if (returnFocus && returnFocus.isConnected) returnFocus.focus(); }
  function visits() {
    show('Door knocks & conversations');
    heading(board.counts.face + ' reported door knocks');
    note('Attempts and repeat visits are different from unique, substantive in-person conversations. Card drops, closed doors and sightings do not count toward the 100-conversation goal.');
    if (!board.visits.length) {
      note('The existing total has no linked visit-by-visit history in this snapshot. The business identities, dates and outcomes still need reconciliation with the private CRM. Pipeline entries are not proof of visits.', 'empty-state');
      body.appendChild(button('Browse available companies', function () { directory(); }));
      return;
    }
    var unique = new Set(board.visits.map(function (v) { return v.companyId; })).size;
    note(board.visits.length + ' documented visit records · ' + unique + ' unique businesses · ' + board.conversations + ' documented substantive conversations / 100 (lower bound).');
    if (unique !== board.counts.face) note('The reported dial and linked business count differ; review the source records before changing the total.');
    board.visits.forEach(function (v) { record(v, v.substantive ? 'Substantive conversation' : 'Visit / attempt'); });
  }
  function meetings() {
    show('Meetings & presentations');
    heading(board.counts.meetings + ' reported meetings');
    if (!board.meetings.length) note('Completed meeting identities and notes are not linked to the existing total. Prepared presentations below are not counted as completed meetings.', 'empty-state');
    else { note(board.meetings.length + ' completed meeting records available.'); board.meetings.forEach(function (m) { record(m, 'Completed meeting'); }); }
    heading('Prepared · arrange the next meeting');
    note('These are next actions, not booked appointments.');
    board.preparations.forEach(function (p) { record(p, 'Prepared'); body.appendChild(button('Open ' + p.name, function () { openLead(p.id); })); });
  }
  function revenue() {
    show('Revenue toward $10,000');
    note('Agreed work, proposed work and payments received are separate. Proposed amounts never increase collected revenue.');
    [['Collected',board.revenue.collected],['Agreed',board.revenue.agreed],['Proposed',board.revenue.proposed]].forEach(function (x) { heading(x[0] + ': ' + cash(x[1])); });
    if (board.revenue.collected == null) note('No verified payment total is available. This is unknown, not a confirmed $0.');
    heading('A possible route to the goal');
    note('4 × $2,400 + $750 = $10,350. This is a planning example, not four closed clients.');
    board.revenue.deals.forEach(function (d) { record({ name: d.name || d.companyId, status: d.status + ' · ' + cash(d.amount), notes: d.note || '', date: d.date, source: d.source }, 'Deal'); });
  }
  function directory(category, temperature, missingOnly) {
    show(category || (missingOnly ? 'Missing map coordinates' : temperature ? temperature + ' prospects' : 'Companies'));
    if (category) body.appendChild(button('All categories', categories, 'inline-button'));
    var source = missingOnly ? board.mapMissing : board.companies;
    note(board.directoryComplete ? 'Full supplied CRM directory.' : 'Available snapshot only. The full CRM is not connected; missing categories are not empty markets.');
    var label = el('label', 'search-label', 'Search companies, people or towns');
    var input = el('input', 'company-search'); input.type = 'search'; input.placeholder = 'Search'; input.id = 'company-search'; label.htmlFor = input.id;
    body.appendChild(label); body.appendChild(input);
    var count = el('p', 'detail-note'); body.appendChild(count); var list = el('div', 'browse-list'); body.appendChild(list);
    function render() {
      clear(list); var query = input.value.trim().toLowerCase();
      var found = source.filter(function (c) {
        return (!category || c.trade === category) && (!temperature || DailyModel.temperature(c.priority) === temperature) &&
          (!query || [c.name,c.contact,c.town,c.trade,c.stage].join(' ').toLowerCase().indexOf(query) >= 0);
      });
      count.textContent = found.length + ' available ' + (found.length === 1 ? 'company' : 'companies');
      if (!found.length) list.appendChild(el('p', 'empty-state', 'No matching records in the available snapshot. Connect the private CRM directory to browse this category.'));
      found.sort(function(a,b){return a.name.localeCompare(b.name);}).forEach(function (c) {
        var b = button('', function () { openLead(c.id); });
        b.appendChild(el('strong','',c.name));
        b.appendChild(el('span','history-meta',[c.trade,c.town,DailyModel.temperature(c.priority)].filter(Boolean).join(' · ')));
        b.appendChild(el('span','',c.nextStep || c.action || c.stage || 'No next action recorded'));
        list.appendChild(b);
      });
    }
    input.addEventListener('input',render); render();
  }
  function categories() {
    show('Categories');
    note(board.directoryComplete ? 'Browse the supplied CRM directory by trade.' : 'Only companies included in this snapshot can be opened. Full-CRM category counts and names need the private data connection.');
    board.categories.forEach(function (c) {
      var b = button('',function(){directory(c.trade);});
      b.appendChild(el('strong','',c.trade));
      b.appendChild(el('span','history-meta',c.available + ' available' + (c.reported ? ' · ' + c.reported + ' previously reported, records not linked' : '')));
      body.appendChild(b);
    });
  }
  function countdown() {
    var node=document.getElementById('departure-days'); if(!node) return;
    var days=DailyModel.daysUntil(Date.now(),'2026-11-30');
    node.textContent=days>0 ? days+' days to departure goal' : days===0 ? 'Departure goal is today' : 'Departure goal was '+Math.abs(days)+' days ago';
  }
  function renderGoal() {
    var root=document.getElementById('daily-goal'); clear(root);
    var top=el('div','goal-top'); top.appendChild(el('span','goal-label','$10,000 revenue goal'));
    var days=el('span','departure');days.id='departure-days';top.appendChild(days);root.appendChild(top);
    var b=button('',revenue,'revenue-open');
    b.appendChild(el('strong','',board.revenue.collected==null ? 'Payment total unconfirmed' : cash(board.revenue.collected)+' collected'));
    b.appendChild(el('span','',cash(board.revenue.agreed)+' agreed · '+cash(board.revenue.proposed)+' proposed'));
    root.appendChild(b);
    if(board.revenue.collected!=null){var progress=el('progress');progress.max=10000;progress.value=board.revenue.collected;progress.setAttribute('aria-label','Collected revenue toward ten thousand dollars');root.appendChild(progress);}
    root.appendChild(el('p','goal-foot','Nov 30, 2026 · New York time · desired departure, not booked'));
    countdown();if(timer)clearInterval(timer);timer=setInterval(countdown,60000);
  }
  function init(data,callback) {
    board=data;openLead=callback;ensureSheet();renderGoal();
    document.getElementById('source-note').textContent=board.sourceLabel+' · as of '+(board.asOfLabel||'unknown')+'. '+board.companies.length+' available companies.';
    var cold=document.getElementById('cold-block');clear(cold);
    cold.appendChild(button('Cold · '+board.companies.filter(function(c){return c.priority==='Low';}).length+' available prospects',function(){directory(null,'Cold');},'cold-open'));
    var coverage=document.getElementById('map-coverage');clear(coverage);
    coverage.appendChild(el('span','',board.places.length+' mapped / '+board.mapEligible.length+' eligible available records. '+board.mapExcluded+' excluded from visits. '));
    coverage.appendChild(button(board.mapMissing.length+' without coordinates',function(){directory(null,null,true);},'inline-button'));
    if(!board.directoryComplete)coverage.appendChild(el('span','',' Curated snapshot; not the full CRM map.'));
  }
  document.addEventListener('visibilitychange',function(){if(!document.hidden)countdown();});
  document.addEventListener('keydown',function(event){
    var visible=Array.from(document.querySelectorAll('#app:not([hidden]) .sheet:not([hidden])')).sort(function(a,b){return Number(getComputedStyle(b).zIndex)-Number(getComputedStyle(a).zIndex);});
    if(!visible.length)return;var top=visible[0];
    var nodes=Array.from(top.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')).filter(function(n){return n.getClientRects().length;});
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();var closer=top.querySelector('.sheet-x');if(closer)closer.click();}
    if(event.key==='Tab'&&nodes.length){var first=nodes[0],last=nodes[nodes.length-1];if(!top.contains(document.activeElement)||(event.shiftKey&&document.activeElement===first)){event.preventDefault();(event.shiftKey?last:first).focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  },true);
  window.DailyBoard={init:init,visits:visits,meetings:meetings,revenue:revenue,categories:categories,directory:directory,close:close,destroy:function(){close();if(timer)clearInterval(timer);board=null;if(body)clear(body);}};
})();
