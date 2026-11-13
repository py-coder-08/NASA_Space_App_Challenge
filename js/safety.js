/* Fire safety page: lessons from incidents (kept apart from research), a cabin
   oxygen check, and trackers for corrective actions, hazard tickets and inspections.
   Tracker data is saved in this browser only (localStorage). */
(function (g) {
  const KEY = 'mgf-tracker-v1';
  const A = () => g.MGFApp, esc = s => A().esc(s);
  const day = 864e5;
  const iso = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const todayIso = () => iso(Date.now());
  const plus = n => iso(Date.now() + n * day);
  const uid = () => Math.random().toString(36).slice(2, 9);
  let S = null, tab = 'actions', ifilter = 'all';

  function seed() {
    return {
      actions: [
        { id: uid(), title: 'Time a crew escape from every hatch and door under worst-case conditions', owner: 'Unassigned', due: plus(14), done: false, src: 'Apollo 1 lesson', suggested: true },
        { id: uid(), title: 'Confirm every crew member has two clear escape routes and a mask within reach', owner: 'Unassigned', due: plus(21), done: false, src: 'Mir lesson', suggested: true }
      ],
      tickets: [
        { id: uid(), n: 1, title: 'Cable bundle behind galley panel shows scorched insulation', loc: 'Galley panel B', sev: 2, owner: 'Unassigned', status: 'Open', created: todayIso(), suggested: true }
      ],
      inspections: [
        { id: uid(), kind: 'Fire safety inspection', area: 'Whole habitat', due: plus(12), every: 90, doneOn: null, suggested: true },
        { id: uid(), kind: 'Emergency lighting check', area: 'Exit routes', due: plus(-4), every: 30, doneOn: null, suggested: true },
        { id: uid(), kind: 'Fire door audit', area: 'Compartment doors', due: plus(-40), every: 180, doneOn: plus(-35), suggested: true },
        { id: uid(), kind: 'Fire door audit', area: 'Compartment doors', due: plus(145), every: 180, doneOn: null, suggested: true }
      ]
    };
  }
  function load() { try { const j = localStorage.getItem(KEY); if (j) return JSON.parse(j); } catch (e) {} return seed(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const istatus = i => i.doneOn ? 'completed' : (i.due < todayIso() ? 'overdue' : 'upcoming');
  const SEV = ['Low', 'Moderate', 'High', 'Critical'];
  const daysTo = d => Math.round((new Date(d + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / day);
  const rel = d => { const n = daysTo(d); return n === 0 ? 'today' : n > 0 ? 'in ' + n + ' day' + (n > 1 ? 's' : '') : Math.abs(n) + ' day' + (n < -1 ? 's' : '') + ' overdue'; };

  function counts() {
    const aOver = S.actions.filter(a => !a.done && a.due < todayIso()).length, iOver = S.inspections.filter(i => istatus(i) === 'overdue').length;
    const soon = S.actions.filter(a => !a.done && daysTo(a.due) >= 0 && daysTo(a.due) <= 7).length + S.inspections.filter(i => istatus(i) === 'upcoming' && daysTo(i.due) <= 7).length;
    const open = S.tickets.filter(t => t.status !== 'Closed').length;
    const done = S.actions.filter(a => a.done).length + S.inspections.filter(i => i.doneOn).length + S.tickets.filter(t => t.status === 'Closed').length;
    return { over: aOver + iOver, soon, open, done };
  }

  function lessons() {
    return g.MGF_LESSON_CATS.map(c => `<section class="lcat" id="cat-${c.id}"><div class="sec-head"><h3 class="lcat-t">${esc(c.title)}</h3><p>${esc(c.blurb)}</p></div>
      <div class="lgrid">${g.MGF_LESSONS.filter(l => l.cat === c.id).map(l => `<article class="panel lesson" id="les-${l.id}">
        <div class="meta"><span class="tag">${esc(l.year)}</span><span class="tag">${esc(c.title.split(' ')[0] === 'Fires' ? 'Incident' : c.id === 'design' ? 'Incident' : 'Technology')}</span></div>
        <h4>${esc(l.title)}</h4><p>${esc(l.summary)}</p>
        <ul class="facts">${l.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="learn"><h5>What to learn</h5><ul>${l.learn.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        ${l.fixes.length ? `<div class="learn"><h5>What changed afterwards</h5><ul>${l.fixes.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
        <div class="learn"><h5>Corrective actions to consider</h5>${l.actions.map((a, k) => `<div class="addrow"><span>${esc(a)}</span><button class="btn sm ghost" data-add="${l.id}:${k}">Add to tracker</button></div>`).join('')}</div>
        <div class="uses"><h4>Where Ember Watch reflects it</h4>${l.uses.map(u => `<div class="use"><a class="go" href="#${u[1]}" data-go="${u[1]}">${u[1] === 'lab' ? 'Lab' : 'Methodology'}</a><span>${esc(u[0])}</span></div>`).join('')}</div>
        <div class="src"><a class="btn sm ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.source)}</a></div></article>`).join('')}</div></section>`).join('');
  }

  function atmos() {
    return `<section class="band" id="atmos"><div class="sec-head"><h2>Cabin oxygen check</h2><p>Apollo 1 burned in a 100 % oxygen cabin. Oxygen partial pressure, not just percentage, sets how fast things burn. Compare any cabin to air at sea level.</p></div>
      <div class="panel atm"><div class="atm-in"><label>Oxygen (%)<input type="number" id="atO" value="21" min="0" max="100" step="0.1"></label><label>Total pressure (kPa)<input type="number" id="atP" value="101.3" min="10" max="300" step="0.1"></label></div>
      <div class="atm-out" id="atOut" aria-live="polite"></div></div></section>`;
  }
  function atmCalc() {
    const o = parseFloat(document.getElementById('atO').value), p = parseFloat(document.getElementById('atP').value), out = document.getElementById('atOut');
    if (!(o >= 0 && p > 0)) { out.textContent = 'Enter oxygen as a percentage and total pressure in kPa.'; return; }
    const pO = o / 100 * p, ref = 0.2095 * 101.325, r = pO / ref, band = r <= 1.15 ? ['Close to air at sea level', 0] : r <= 1.6 ? ['Oxygen-enriched: fires spread faster', 2] : ['Highly enriched: treat most materials as flammable', 3];
    out.innerHTML = `<div><b>${pO.toFixed(1)} kPa</b><span>oxygen partial pressure</span></div><div><b>${r.toFixed(2)}x</b><span>air at sea level (${ref.toFixed(1)} kPa)</span></div><div><span class="pill lv${band[1]}">${esc(band[0])}</span><span class="muted">Bands at 1.15x and 1.6x are assumptions for guidance, not NASA limits.</span></div>`;
  }

  function summary() {
    const c = counts();
    return `<div class="sumrow">${[['Overdue', c.over, c.over ? 'bad' : ''], ['Due within 7 days', c.soon, ''], ['Open hazard tickets', c.open, c.open ? 'warn' : ''], ['Completed', c.done, 'ok']].map(x => `<div class="sum ${x[2]}"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}</div>`;
  }

  function trackerBody() {
    const t = todayIso();
    if (tab === 'actions') {
      const rows = S.actions.slice().sort((a, b) => a.done - b.done || a.due.localeCompare(b.due));
      return `<form class="addf" data-form="action"><input name="title" placeholder="Corrective action" required aria-label="Corrective action"><input name="owner" placeholder="Assign to" aria-label="Assign to"><input type="date" name="due" value="${plus(14)}" required aria-label="Due date"><button class="btn sm">Add action</button></form>
      <ul class="tl">${rows.length ? rows.map(a => { const over = !a.done && a.due < t; return `<li class="${a.done ? 'done' : ''}${over ? ' over' : ''}"><input type="checkbox" data-act="toggle" data-id="${a.id}" ${a.done ? 'checked' : ''} aria-label="Mark complete"><div class="tx"><span class="ti">${esc(a.title)}</span><span class="sub">${esc(a.owner || 'Unassigned')} &middot; due ${esc(a.due)}${a.done ? '' : ' (' + rel(a.due) + ')'}${a.src ? ' &middot; ' + esc(a.src) : ''}</span></div><button class="x" data-act="del" data-id="${a.id}" aria-label="Delete">&times;</button></li>`; }).join('') : '<li class="empty">No actions yet. Add one above or from a lesson.</li>'}</ul>`;
    }
    if (tab === 'tickets') {
      const rows = S.tickets.slice().sort((a, b) => (a.status === 'Closed') - (b.status === 'Closed') || b.sev - a.sev);
      return `<form class="addf" data-form="ticket"><input name="title" placeholder="Hazard found" required aria-label="Hazard"><input name="loc" placeholder="Location" aria-label="Location"><select name="sev" aria-label="Severity">${SEV.map((s, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${s}</option>`).join('')}</select><input name="owner" placeholder="Assign to" aria-label="Assign to"><button class="btn sm">Raise ticket</button></form>
      <ul class="tl">${rows.length ? rows.map(h => `<li class="${h.status === 'Closed' ? 'done' : ''}"><span class="tno mono">HT-${String(h.n).padStart(3, '0')}</span><div class="tx"><span class="ti">${esc(h.title)}</span><span class="sub">${esc(h.loc || 'No location')} &middot; ${esc(h.owner || 'Unassigned')} &middot; raised ${esc(h.created)}</span></div><span class="pill lv${h.sev}">${SEV[h.sev]}</span><select data-act="status" data-id="${h.id}" aria-label="Ticket status">${['Open', 'In progress', 'Closed'].map(s => `<option ${s === h.status ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="x" data-act="del" data-id="${h.id}" aria-label="Delete">&times;</button></li>`).join('') : '<li class="empty">No hazard tickets. Raise one when you spot a hazard.</li>'}</ul>`;
    }
    const rows = S.inspections.filter(i => ifilter === 'all' || istatus(i) === ifilter).sort((a, b) => (a.doneOn ? 1 : 0) - (b.doneOn ? 1 : 0) || a.due.localeCompare(b.due));
    return `<form class="addf" data-form="insp"><select name="kind" aria-label="Inspection type"><option>Fire safety inspection</option><option>Emergency lighting check</option><option>Fire door audit</option></select><input name="area" placeholder="Area" aria-label="Area"><input type="date" name="due" value="${plus(30)}" required aria-label="Due date"><select name="every" aria-label="Repeats"><option value="30">Monthly</option><option value="90" selected>Quarterly</option><option value="180">Twice a year</option><option value="0">One-off</option></select><button class="btn sm">Schedule</button></form>
    <div class="seg" role="group" aria-label="Inspection filter">${['all', 'upcoming', 'overdue', 'completed'].map(f => `<button data-act="filter" data-f="${f}" aria-pressed="${ifilter === f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
    <ul class="tl">${rows.length ? rows.map(i => { const st = istatus(i); return `<li class="${st === 'completed' ? 'done' : ''}${st === 'overdue' ? ' over' : ''}">${i.doneOn ? '' : `<input type="checkbox" data-act="complete" data-id="${i.id}" aria-label="Mark inspection complete">`}${i.doneOn ? '<span class="chk" aria-hidden="true">&#10003;</span>' : ''}<div class="tx"><span class="ti">${esc(i.kind)}${i.area ? ' &middot; ' + esc(i.area) : ''}</span><span class="sub">${i.doneOn ? 'completed ' + esc(i.doneOn) : 'due ' + esc(i.due) + ' (' + rel(i.due) + ')'}${i.every ? ' &middot; repeats every ' + i.every + ' days' : ''}</span></div><span class="pill st-${st}">${st}</span><button class="x" data-act="del" data-id="${i.id}" aria-label="Delete">&times;</button></li>`; }).join('') : '<li class="empty">Nothing in this view.</li>'}</ul>`;
  }

  function drawTracker() {
    const el = document.getElementById('trk'); if (!el) return;
    document.getElementById('sum').innerHTML = summary();
    el.innerHTML = trackerBody();
    document.querySelectorAll('#trkTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
  }

  function render() {
    const root = A().$('#view-safety');
    root.innerHTML = `
      <div class="lab-head"><h1 style="font-size:clamp(1.9rem,4vw,2.8rem)">Fire safety insights</h1><p>Assign corrective actions, raise hazard tickets and schedule inspections. Upload your cabin plan and conditions. Then read the incident case studies at the bottom for the lessons behind them. The research papers are on the References page.</p></div>
      <nav class="chips" aria-label="Jump to"><a href="#safety" data-jump="trackers">Tracker</a><a href="#safety" data-jump="plan">Cabin plan</a><a href="#safety" data-jump="atmos">Oxygen check</a><a href="#safety" data-jump="cases">Incident case studies</a>${g.MGF_LESSON_CATS.map(c => `<a href="#safety" data-jump="cat-${c.id}">${esc(c.title)}</a>`).join('')}</nav>
      <section class="band" id="trackers" style="padding-top:8px"><div class="sec-head"><h2>Action and inspection tracker</h2><p>Assign corrective actions, raise hazard tickets and track fire safety inspections, emergency lighting checks and fire door audits. Items marked Suggested are starter examples you can delete. Data is saved in this browser only.</p></div>
        <div id="sum"></div>
        <div class="seg trk-tabs" id="trkTabs" role="group" aria-label="Tracker section"><button data-tab="actions">Corrective actions</button><button data-tab="tickets">Hazard tickets</button><button data-tab="insp">Inspections</button></div>
        <div class="panel" id="trk"></div>
        <div class="row" style="margin-top:12px"><button class="btn sm ghost" id="trkReset">Reset to starter examples</button></div></section>
      <div id="planSlot"></div>
      ${atmos()}
      <section class="band" id="cases"><div class="sec-head"><h2>Incident case studies</h2><p>Each summary is written from the NASA page linked on its card. Corrective actions are suggestions for you to review, not NASA requirements.</p></div>${lessons()}</section>`;
    g.MGFPlan.mount(root.querySelector('#planSlot'));
    document.getElementById('atO').oninput = document.getElementById('atP').oninput = atmCalc; atmCalc();
    drawTracker();
    root.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); const t = document.getElementById(j.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
      const go = e.target.closest('[data-go]'); if (go) { e.preventDefault(); location.hash = go.dataset.go; return; }
      const ad = e.target.closest('[data-add]');
      if (ad) { const [id, k] = ad.dataset.add.split(':'), l = g.MGF_LESSONS.find(x => x.id === id); S.actions.push({ id: uid(), title: l.actions[+k], owner: 'Unassigned', due: plus(14), done: false, src: l.title }); save(); ad.textContent = 'Added'; ad.disabled = true; drawTracker(); return; }
      const tb = e.target.closest('#trkTabs button'); if (tb) { tab = tb.dataset.tab; drawTracker(); return; }
      if (e.target.id === 'trkReset') { S = seed(); save(); drawTracker(); return; }
      const b = e.target.closest('[data-act]'); if (!b) return; const id = b.dataset.id, act = b.dataset.act;
      if (act === 'filter') { ifilter = b.dataset.f; drawTracker(); return; }
      if (act === 'del') { ['actions', 'tickets', 'inspections'].forEach(k => S[k] = S[k].filter(x => x.id !== id)); }
      else if (act === 'toggle') { const a = S.actions.find(x => x.id === id); if (a) a.done = b.checked; }
      else if (act === 'complete') { const i = S.inspections.find(x => x.id === id); if (i) { i.doneOn = todayIso(); if (i.every) S.inspections.push({ id: uid(), kind: i.kind, area: i.area, due: iso(Date.now() + i.every * day), every: i.every, doneOn: null }); } }
      save(); drawTracker();
    });
    root.addEventListener('change', e => { const s = e.target.closest('[data-act=status]'); if (s) { const t = S.tickets.find(x => x.id === s.dataset.id); if (t) { t.status = s.value; save(); drawTracker(); } } });
    root.addEventListener('submit', e => {
      const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); const d = Object.fromEntries(new FormData(f));
      if (f.dataset.form === 'action') S.actions.push({ id: uid(), title: d.title.trim(), owner: d.owner.trim() || 'Unassigned', due: d.due, done: false });
      if (f.dataset.form === 'ticket') S.tickets.push({ id: uid(), n: Math.max(0, ...S.tickets.map(t => t.n)) + 1, title: d.title.trim(), loc: d.loc.trim(), sev: +d.sev, owner: d.owner.trim() || 'Unassigned', status: 'Open', created: todayIso() });
      if (f.dataset.form === 'insp') S.inspections.push({ id: uid(), kind: d.kind, area: d.area.trim(), due: d.due, every: +d.every, doneOn: null });
      save(); drawTracker();
    });
  }
  S = null;
  g.MGFSafety = { render: () => { S = load(); render(); } };
})(window);
