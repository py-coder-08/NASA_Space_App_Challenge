/* Microgravity combustion lab: demo data, own data, decision tree, risk report */
(function (g) {
  const A = g.MGFApp, E = g.MGF, C = g.MGF_CONTENT, CFG = g.MGF_CONFIG, D = g.MGF_DATA;
  const { esc, $, $$ } = A, fmt = E.fmt;
  const state = {
    mode: 'demo', dsId: 'D1', varId: null, depth: 'summary', ctx: Object.assign({}, CFG.defaultContext),
    own: { fuel: 'C12', P: 1, D0: 4.5, regime: 'auto', K: '', Tpk: '', DfMax: '', Qpk: '', DextHot: '', DextCool: '', soot: '', csv: '' },
    reveal: null, timer: null, last: null
  };
  state.varId = D.datasets[0].variants[0].id;
  const STEP_ORDER = ['start', 's1', 's2', 's3', 's4', 's5', 's6', 'end'];
  const SRC = { data: 'NASA data', model: 'model', user: 'yours', ref: 'reference', assumed: 'assumed' };
  const tag = s => `<span class="tag ${s === 'user' ? 'user' : s}">${SRC[s] || s}</span>`;
  const ds = () => D.datasets.find(d => d.id === state.dsId);
  const variant = () => ds().variants.find(v => v.id === state.varId) || ds().variants[0];

  function select(dsId, varId) {
    state.mode = 'demo'; state.dsId = dsId; const d = ds(); state.varId = (varId && d.variants.find(v => v.id === varId)) ? varId : d.variants[0].id;
    if (state.built) { buildAside(); syncMode(); refresh(); }
  }

  /* ---------- compute ---------- */
  function compute() {
    if (state.mode === 'demo') {
      const v = variant(), F = E.completeFeatures(v, state.ctx);
      return { F, r: E.assess(F, state.ctx), title: ds().title + ' / ' + v.label };
    }
    const o = state.own, num = x => (x === '' || x === null || isNaN(+x)) ? null : +x;
    const src = {}; let raw;
    const meta = { fuel: o.fuel, P: num(o.P) || 1, D0: num(o.D0), mode: o.regime === 'auto' ? 'hot+cool' : o.regime };
    const parsed = o.csv.trim() ? parseCsv(o.csv) : null;
    if (parsed && parsed.error) return { error: parsed.error };
    if (parsed) { raw = E.featuresFromSeries(parsed.cols, meta); Object.keys(raw.src).forEach(k => raw.src[k] = 'user'); }
    else raw = { fuel: meta.fuel, P: meta.P, D0: meta.D0, mode: meta.mode, src: { fuel: 'user', P: 'user', D0: 'user' } };
    [['K', o.K], ['Tpk', o.Tpk], ['DfMax', o.DfMax], ['Qpk', o.Qpk], ['DextHot', o.DextHot], ['DextCool', o.DextCool], ['soot', o.soot]].forEach(([k, val]) => { const n = num(val); if (n !== null) { raw[k] = n; raw.src[k === 'soot' ? 'sootPpm' : k] = 'user'; } });
    if (raw.P < 0.1 || raw.P > 20) return { error: 'Pressure must be between 0.1 and 20 atm.' };
    if (raw.D0 !== null && raw.D0 !== undefined && (raw.D0 < 0.05 || raw.D0 > 12)) return { error: 'Droplet diameter must be between 0.05 and 12 mm.' };
    const F = E.completeFeatures(raw, state.ctx);
    return { F, r: E.assess(F, state.ctx), title: 'Your conditions' + (parsed ? ' (with measured series)' : '') };
  }
  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim()); if (lines.length < 5) return { error: 'The pasted data needs a header row and at least 4 data rows.' };
    const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
    const head = lines[0].split(sep).map(s => s.trim().toLowerCase().replace(/^﻿/, ''));
    const find = re => head.findIndex(h => re.test(h));
    const idx = { t: find(/^(t|time)/), Df: find(/flame/), T: find(/(tmax|t_max|temp)/), Q: find(/(rad|^q|power)/) };
    idx.D = head.findIndex((h, i) => /(^d$|diam|droplet|^d\()/.test(h) && i !== idx.Df);
    if (idx.t < 0) return { error: 'No time column found. Name the first column "time" or "t".' };
    const cols = { t: [] }; ['D', 'Df', 'T', 'Q'].forEach(k => { if (idx[k] >= 0) cols[k] = []; });
    for (const l of lines.slice(1)) { const p = l.split(sep).map(Number); if (p.some(isNaN) && isNaN(p[idx.t])) continue; cols.t.push(p[idx.t]); ['D', 'Df', 'T', 'Q'].forEach(k => { if (cols[k]) cols[k].push(p[idx[k]]); }); }
    if (cols.t.length < 5) return { error: 'Could not read enough numeric rows.' };
    if (!cols.D && !cols.Df && !cols.T && !cols.Q) return { error: 'No data columns recognised. Use headers such as time, diameter, flame_diameter, tmax, radiance.' };
    return { cols };
  }

  /* ---------- gauge ---------- */
  function gauge(score, level) {
    const L = CFG.levels, cx = 100, cy = 100, R = 78;
    const pt = (s, r = R) => { const a = Math.PI * (1 - s / 100); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    const arc = (a, b, cls) => { const p0 = pt(a), p1 = pt(b); return `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${R} ${R} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="var(--${cls})" stroke-width="14" opacity=".9"/>`; };
    const n = pt(Math.min(100, score), 60);
    return `<svg class="gauge" viewBox="0 0 200 124" role="img" aria-label="Risk score ${fmt(score, 0)} out of 100, ${E.LEVELS[level]}">
      ${arc(0, L.low - .6, 'low')}${arc(L.low + .6, L.moderate - .6, 'mod')}${arc(L.moderate + .6, L.high - .6, 'high')}${arc(L.high + .6, 100, 'crit')}
      <line x1="${cx}" y1="${cy}" x2="${n[0].toFixed(1)}" y2="${n[1].toFixed(1)}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="var(--text)"/>
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="var(--f-display)" font-size="26" font-weight="700" fill="var(--text)">${fmt(score, 0)}</text></svg>`;
  }

  /* ---------- results ---------- */
  function renderResults() {
    const box = $('#results'); A.clearCharts(box);
    const out = state.last = compute();
    if (out.error) { box.innerHTML = `<div class="panel empty"><b>Check your inputs</b><p style="margin:6px auto 0">${esc(out.error)}</p></div>`; return; }
    const { F, r } = out, det = state.depth === 'detailed';
    const top = r.drivers.slice(0, 2).map(d => d.label.toLowerCase());
    const lvlSentence = ['Low risk. The flame is small, short-lived or weakly energetic for this cabin.', 'Moderate risk. This needs active monitoring and a prepared, local response.', 'High risk. Respond immediately and protect the crew.', 'Critical risk. Maximum response now.'][r.level];
    const stat = (k, label, val, unit, src) => `<div class="stat"><small>${label}</small><b>${val}${unit ? ' <span class="muted" style="font-weight:400;font-size:.76rem">' + unit + '</span>' : ''}</b>${src ? tag(src) : ''}</div>`;
    box.innerHTML = `
    <section class="panel verdict">
      <div>${gauge(r.composite, r.level)}</div>
      <div>
        <span class="pill lv${r.level}">${E.LEVELS[r.level]} risk</span>
        <h2>${esc(out.title)}</h2>
        <p>${lvlSentence} Main drivers: ${top.join(' and ')}.${r.coolShare > .4 ? ' About ' + fmt(r.coolShare * 100, 0) + ' % of the burn is a cool flame, which is hard to see.' : ''}${!r.fireDetected ? ' No trigger fired, so the tree stops at step 3 and keeps monitoring.' : ''}</p>
        <div class="stats">
          ${stat('Tpk', 'Peak flame temperature', fmt(F.Tpk, 0), 'K', F.src.Tpk)}
          ${stat('Df', 'Peak flame diameter', fmt(F.DfMax, 1), 'mm', F.src.DfMax)}
          ${stat('Q', 'Peak radiated power', fmt(F.Qpk, 1), 'W', F.src.Qpk)}
          ${stat('K', 'Burning-rate constant', fmt(F.K, 2), 'mm2/s', F.src.K)}
          ${stat('t', 'Burn time', fmt(F.tBurn, 1), 's', F.src.tBurn)}
          ${stat('co', 'CO if fuel load burns', fmt(r.gas.coPpm, 0), 'ppm', 'assumed')}
          ${det ? stat('dh', 'Hot-flame extinction diameter', fmt(F.DextHot, 2), 'mm', F.src.DextHot) + stat('dc', 'Cool-flame extinction diameter', fmt(F.DextCool, 2), 'mm', F.src.DextCool) + stat('soot', 'Flame soot (volume fraction)', fmt(F.sootPpm, 1), 'ppm', F.src.sootPpm) + stat('hrr', 'Peak heat release', fmt(F.HRRpk, 0), 'W', 'model') : ''}
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="block-h"><div><h3>${state.mode === 'demo' ? 'The NASA data' : 'Simulated burn for your conditions'}</h3><p>${state.mode === 'demo' ? 'Curves straight from the file. Values tagged <b>NASA data</b> above come from these; anything the file does not contain is filled by the calibrated model and tagged <b>model</b>.' : 'The model integrates the d-squared law through the hot, extinction and cool-flame stages. Measured values you entered replace the model values.'}</p></div></div>
      <div class="charts" id="charts"></div>
    </section>

    <section class="panel">
      <div class="block-h"><div><h3>Safety decision tree</h3><p>${det ? 'Each step shows the numbers behind the decision. The highlighted path is the one this event takes.' : 'The highlighted path is the one this event takes. Switch to Detailed analysis to see the numbers at every step.'}</p></div>
        <div class="stepper"><button class="btn sm ghost" id="tRep">Replay step by step</button><button class="btn sm ghost" id="tPrev" hidden>Back</button><button class="btn sm" id="tNext" hidden>Next step</button><button class="btn sm ghost" id="tAll" hidden>Show all</button></div></div>
      <div id="tree"></div>
      <div class="legend"><span><i style="background:var(--surface)"></i>Process</span><span><i style="background:var(--high-bg)"></i>Decision</span><span><i style="background:var(--low-bg)"></i>Safe / continue</span><span><i style="border-color:var(--mod)"></i>Moderate</span><span><i style="border-color:var(--high)"></i>High / critical</span></div>
    </section>

    <section class="panel report" id="report"></section>`;
    placeViewer(out); drawCharts(F, out); drawTree(r); drawReport(out); wireTree(r);
  }

  function drawCharts(F, out) {
    const wrap = $('#charts'); let specs;
    if (state.mode === 'demo') specs = ds().charts.slice(0, state.depth === 'detailed' ? 6 : 2);
    else {
      const s = F.sim, n = s.t.length, step = Math.max(1, Math.floor(n / 90)), pick = a => s.t.map((t, i) => [t, a[i]]).filter((_, i) => i % step === 0 || i === n - 1);
      specs = [
        { title: 'Droplet size', x: 'time (s)', y: 'D squared / D0 squared', series: [{ label: 'Model', kind: 'model', data: pick(s.D.map(d => d * d / (s.D0 * s.D0))) }] },
        { title: 'Flame diameter', x: 'time (s)', y: 'Flame diameter (mm)', series: [{ label: 'Model', kind: 'model', data: pick(s.Df) }] },
        { title: 'Peak flame temperature', x: 'time (s)', y: 'T max (K)', series: [{ label: 'Model', kind: 'model', data: pick(s.T) }] },
        { title: 'Radiated power', x: 'time (s)', y: 'Q (W)', series: [{ label: 'Model', kind: 'model', data: pick(s.Q) }] }
      ].slice(0, state.depth === 'detailed' ? 4 : 2);
    }
    wrap.innerHTML = specs.map((s, i) => `<div class="chart-card"><h4>${esc(s.title)}</h4><div class="chart"><canvas id="lc${i}"></canvas></div></div>`).join('');
    specs.forEach((s, i) => A.mkChart($('#lc' + i), s));
  }

  /* ---------- decision tree ---------- */
  function drawTree(r) {
    const det = state.depth === 'detailed', st = Object.fromEntries(r.steps.map(s => [s.id, s]));
    const rv = state.reveal, idxOf = id => STEP_ORDER.indexOf(id);
    const fire = r.fireDetected;
    const cls = (id, extra = '') => {
      const i = idxOf(id); let c = extra;
      if (rv !== null && i > rv) c += ' hide'; else if (!fire && i > 3) c += ' dim'; else c += ' on';
      return c;
    };
    const lines = id => det ? `<ul class="lines">${st[id].lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
    const arrow = id => `<div class="arrow ${(rv !== null && idxOf(id) > rv) || (!fire && idxOf(id) > 3) ? 'dim' : ''}"></div>`;
    const evs = Object.values(r.sub).map(o => `<div class="ev"><b><span>${esc(o.label)}</span><span class="mono">${fmt(o.s * 100, 0)}</span></b><div class="bar"><i class="fill${o.s >= .75 ? 3 : o.s >= .5 ? 2 : o.s >= .25 ? 1 : 0}" style="width:${o.s * 100}%"></i></div>${det ? '<small>' + o.parts.map(p => esc(p[0])).join('<br>') + '</small>' : ''}</div>`).join('');
    const lv = r.level, b = { 0: ['6A. Mitigate', 'Automated / local', C.report.low], 1: ['6B. Escalate and respond', '', C.report.moderate], 2: ['6C. Immediate and maximum response', '', C.report.high] };
    const branch = (k, head, pill, sub) => `<div class="br b${k} ${rv !== null && 6 > rv ? 'dim' : (fire && Math.min(2, lv) === k ? 'on' : 'dim')}"><div class="head"><span class="pill lv${k === 2 ? 2 : k}">${pill}</span></div><h4>${head}${sub ? ' <span class="muted" style="font-weight:400">(' + sub + ')</span>' : ''}</h4><ul>${b[k][2].slice(0, det ? 8 : 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    $('#tree').innerHTML = `<div class="tree">
      <div class="tn term ${cls('start')}" id="n-start"><h4>Start: continuous monitoring</h4></div>${arrow('s1')}
      <div class="tn proc ${cls('s1')}" id="n-s1"><h4>1. Collect multi-modal data</h4><div class="why-line">${esc(st.s1.short)}</div>
        <div class="chips">${r.sensors.map(s => `<div class="chip ${s.on ? 'on' : ''}"><b>${esc(s.name)}</b>${det ? '<span>' + esc(s.detail) + '</span>' : ''}</div>`).join('')}</div></div>${arrow('s2')}
      <div class="tn proc ${cls('s2')}" id="n-s2"><h4>2. Analyze and interpret data</h4><div class="why-line">${esc(st.s2.short)}</div>${lines('s2')}</div>${arrow('s3')}
      <div class="decide ${cls('s3')}" id="n-s3"><div><h4>3. Is a fire or unsafe condition detected?</h4><div class="why-line">${fire ? 'Yes. ' + r.triggers.filter(t => t.hit).length + ' of 6 triggers fired.' : 'No. No trigger fired.'}</div></div></div>
      ${det ? `<div class="tn ${cls('s3')}" style="margin-top:10px"><ul class="lines" style="margin:0">${st.s3.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      <div class="side" style="margin-top:2px"><div></div><div class="mid" style="display:grid;justify-items:center">${arrow('s4')}<span class="lbl" style="margin:2px 0">Yes</span></div>
        <div class="no-branch"><div class="hline"></div><div class="tn go ${fire ? 'dim' : 'on'}"><h4>Continue monitoring</h4><div class="why-line">Log data and trends, check sensor health, maintain readiness. Loops back to step 1.</div></div></div></div>
      <div class="tn proc ${cls('s4')}" id="n-s4"><h4>4. Evaluate fire characteristics and context</h4><div class="why-line">${esc(st.s4.short)}</div><div class="eval">${evs}</div></div>${arrow('s5')}
      <div class="decide ${cls('s5')}" id="n-s5"><div><h4>5. What is the risk level?</h4><div class="why-line">${E.LEVELS[r.level]} (score ${fmt(r.composite, 0)} / 100)${r.overrides.length ? '. Hard rule applied.' : ''}</div></div></div>
      ${det ? `<div class="tn ${cls('s5')}" style="margin-top:10px"><ul class="lines" style="margin:0">${st.s5.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      ${arrow('s6')}
      <div class="branches" id="n-s6">${branch(0, b[0][0], 'Low', b[0][1])}${branch(1, b[1][0], 'Moderate', '')}${branch(2, b[2][0], 'High / Critical', '')}</div>${arrow('end')}
      <div class="tn term ${cls('end')}" id="n-end"><h4>Fire controlled / extinguished</h4><div class="why-line">Log incident, analyze data, improve system</div></div>
    </div>`;
  }
  function wireTree(r) {
    const rep = $('#tRep'), prev = $('#tPrev'), next = $('#tNext'), all = $('#tAll');
    const show = i => {
      state.reveal = i; const stepsN = r.fireDetected ? STEP_ORDER.length - 1 : 3;
      drawTree(r); const on = i !== null;
      prev.hidden = next.hidden = all.hidden = !on; rep.hidden = on;
      if (on) { const el = $('#n-' + STEP_ORDER[i]); if (el) el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); next.disabled = i >= stepsN; prev.disabled = i <= 0; }
    };
    rep.onclick = () => show(0); all.onclick = () => show(null);
    next.onclick = () => show(Math.min(STEP_ORDER.length - 1, state.reveal + 1)); prev.onclick = () => show(Math.max(0, state.reveal - 1));
    state.reveal = null;
  }

  /* ---------- report ---------- */
  function reportText(out) {
    const { r, F } = out, R = r.report;
    return [`RISK REPORT: ${out.title}`, `Risk level: ${E.LEVELS[r.level]} (score ${fmt(r.composite, 0)} / 100)`, '', 'Key figures: peak flame ' + fmt(F.Tpk, 0) + ' K, flame diameter ' + fmt(F.DfMax, 1) + ' mm, radiated power ' + fmt(F.Qpk, 1) + ' W, burning-rate constant ' + fmt(F.K, 2) + ' mm2/s, burn time ' + fmt(F.tBurn, 1) + ' s, CO about ' + fmt(r.gas.coPpm, 0) + ' ppm if the fuel load burns.', '',
      'Ranked risk drivers:', ...r.drivers.map((d, i) => `${i + 1}. ${d.label}: ${fmt(d.contrib, 1)} points`), '', 'Immediate response:', ...R.immediate.map(x => '- ' + x), '', 'Precautions:', ...R.precautions.map(x => '- ' + x), '', 'Preventive measures:', ...R.prevent.map(x => '- ' + x), '', 'Findings:', ...R.insights.map(x => '- ' + x)].join('\n');
  }
  function drawReport(out) {
    const { r, F } = out, det = state.depth === 'detailed', R = r.report, box = $('#report');
    const actHead = ['6A. Mitigate (automated, local)', '6B. Escalate and respond', '6C. Immediate and maximum response', '6C. Immediate and maximum response'][r.level];
    const drivers = r.drivers.slice(0, det ? 7 : 3);
    const sens = det ? E.sensitivity(F, state.ctx) : null;
    box.innerHTML = `
      <div class="rhead"><div><h3>Risk report</h3><p class="muted" style="font-size:.9rem">${esc(out.title)}</p></div><div class="stepper"><span class="pill lv${r.level}">${E.LEVELS[r.level]} risk, ${fmt(r.composite, 0)} / 100</span><button class="btn sm ghost" id="copyRep">Copy report</button></div></div>
      ${r.overrides.length ? `<div class="insight"><b>Hard rule applied.</b> ${r.overrides.map(esc).join(' ')}</div>` : ''}
      <div><h4>What drives the score</h4><div class="grid" style="gap:8px;margin-top:12px">${drivers.map(d => `<div class="drv"><span>${esc(d.label)}</span><span class="bar"><i class="fill${d.s >= .75 ? 3 : d.s >= .5 ? 2 : d.s >= .25 ? 1 : 0}" style="width:${d.s * 100}%"></i></span><span class="num">+${fmt(d.contrib, 1)}</span></div>`).join('')}</div>
        ${det ? '<p class="muted" style="font-size:.84rem;margin-top:10px">Each bar is the factor score (0 to 100). The number is the points it adds to the total after weighting.</p>' : ''}</div>
      <div class="rcols">
        <div><h4>${esc(actHead)}</h4><ul class="rlist act l${Math.min(r.level, 2)}">${R.immediate.slice(0, det ? 8 : 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>Precautions</h4><ul class="rlist">${R.precautions.slice(0, det ? 12 : 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>Preventive measures</h4><ul class="rlist">${R.prevent.slice(0, det ? 12 : 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>What the data tells us</h4><div class="grid" style="gap:10px;margin-top:10px">${R.insights.slice(0, det ? 8 : 2).map(x => `<div class="insight">${esc(x)}</div>`).join('') || '<p class="muted">No special findings for this condition.</p>'}</div></div>
      </div>
      ${det ? `
      <div><h4>What would change the score</h4><p class="muted" style="font-size:.88rem;margin:4px 0 10px">Each row re-runs the whole model with one change. Baseline model score: ${fmt(sens.base, 1)}.</p>
        <div class="scroll"><table class="t"><thead><tr><th>Change</th><th>New score</th><th>Difference</th></tr></thead><tbody>${sens.list.map(s => `<tr><td>${esc(s.label)}</td><td class="mono">${fmt(s.score, 1)}</td><td class="mono delta ${s.delta > 0.05 ? 'up' : s.delta < -0.05 ? 'dn' : ''}">${s.delta > 0 ? '+' : ''}${fmt(s.delta, 1)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="rcols"><div><h4>Monitoring after the event</h4><ul class="rlist">${R.monitoring.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div><h4>Where each number came from</h4><div class="scroll"><table class="t"><tbody>${[['Fuel', E.fmt(0, 0) && ({ C7: 'n-heptane', C10: 'n-decane', C12: 'n-dodecane', OTHER: 'other' }[F.fuel] || F.fuel), F.src.fuel], ['Pressure', fmt(F.P, 2) + ' atm', F.src.P], ['Droplet D0', fmt(F.D0, 2) + ' mm', F.src.D0], ['Burning-rate K', fmt(F.K, 2) + ' mm2/s', F.src.K], ['Peak temperature', fmt(F.Tpk, 0) + ' K', F.src.Tpk], ['Flame diameter', fmt(F.DfMax, 1) + ' mm', F.src.DfMax], ['Flame growth', fmt(F.growth, 1) + ' mm/s', F.src.growth], ['Radiated power', fmt(F.Qpk, 1) + ' W', F.src.Qpk], ['Hot extinction diameter', fmt(F.DextHot, 2) + ' mm', F.src.DextHot], ['Cool extinction diameter', fmt(F.DextCool, 2) + ' mm', F.src.DextCool], ['Soot', fmt(F.sootPpm, 1) + ' ppm', F.src.sootPpm]].map(([a, b2, s]) => `<tr><td>${a}</td><td class="mono">${b2}</td><td>${tag(s || 'model')}</td></tr>`).join('')}</tbody></table></div></div></div>` : ''}`;
    $('#copyRep').onclick = async e => {
      const btn = e.target, text = reportText(out);
      try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
      catch (er) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); btn.textContent = 'Copied'; } catch (e2) { btn.textContent = 'Copy failed'; } ta.remove(); }
      setTimeout(() => btn.textContent = 'Copy report', 1600);
    };
  }


  /* ---------- live 3D flame card (built once, moved into each result) ---------- */
  const V = { P: 1, O2: 21, D0: 4.5, vent: 0, prog: 0.08, regime: 'auto', lock: true, grid: true, playing: false, key: '', el: null, view: null, base: null, cache: null, cacheKey: '', F0: null, score0: 0 };
  const SL = [['P', 'Pressure', 'atm', 0.5, 5, 0.05], ['O2', 'Oxygen', '%', 15, 40, 0.5], ['D0', 'Droplet size', 'mm', 0.5, 6, 0.1], ['vent', 'Airflow', 'cm/s', 0, 60, 1], ['prog', 'Burn progress', '%', 0, 100, 1]];
  function buildViewer() {
    const L = C.viewer, el = document.createElement('section'); el.className = 'panel'; el.id = 'flameCard'; V.el = el;
    el.innerHTML = `<div class="block-h"><div><h3>${esc(L.heading)}</h3><p>${esc(L.lead)}</p></div></div>
      <div class="vwr">
        <div class="stage" id="vStage"><canvas id="vCanvas" aria-label="Interactive 3D model of the flame. Drag to rotate, arrow keys also rotate."></canvas>
          <div class="badge" id="vBadge"></div><div class="zoom"><button id="vZin" aria-label="Zoom in">+</button><button id="vZout" aria-label="Zoom out">&minus;</button></div>
          <div class="flow">airflow &rarr;</div><div class="ruler" id="vRuler"></div><div class="cap">Drag to rotate. Faint sphere: 20 mm radius. ${esc(L.note)}</div></div>
        <div class="ctl">
          <div class="live" id="vLive"></div>
          ${SL.map(([k, l, u, mn, mx, st]) => `<div class="field"><label for="vs_${k}">${l}<small class="mono" id="vv_${k}"></small></label><input id="vs_${k}" type="range" min="${mn}" max="${mx}" step="${st}"></div>`).join('')}
          <div class="field"><label for="vs_reg">Flame regime</label><select id="vs_reg"><option value="auto">Automatic (from droplet size)</option><option value="cool">Steady cool flame</option><option value="osc">Oscillating cool flame</option></select></div>
          <div class="row2"><label class="chk"><input type="checkbox" id="vLock" checked> Lock zoom</label><label class="chk"><input type="checkbox" id="vGrid" checked> Show grid</label></div>
          <div class="readout" id="vRead"></div>
          <div class="stepper" style="margin-top:12px"><button class="btn sm" id="vPlay">Play burn</button><button class="btn sm ghost" id="vReset">Reset</button><button class="btn sm ghost" id="vSend">Analyze these settings</button></div>
        </div></div>`;
    let ok = true;
    try { V.view = g.MGFFlame.create($('#vCanvas', el), { lock: true, onFrame: cur => ruler(cur) }); ok = V.view.supported; } catch (e) { ok = false; }
    if (!ok) $('#vStage', el).insertAdjacentHTML('beforeend', '<div class="fallback">The 3D view needs WebGL, which this browser has turned off. The sliders and readouts still work.</div>');
    SL.forEach(([k]) => { $('#vs_' + k, el).oninput = e => { V[k] = k === 'prog' ? +e.target.value / 100 : +e.target.value; V.playing = false; $('#vPlay', el).textContent = 'Play burn'; update(); }; });
    $('#vs_reg', el).onchange = e => { V.regime = e.target.value; if (V.regime !== 'auto' && V.D0 > 1) V.D0 = 0.5; if (V.regime === 'auto' && V.D0 < 3.6) V.D0 = 4.5; update(); };
    $('#vLock', el).onchange = e => { V.lock = e.target.checked; V.view && V.view.setLock(V.lock); };
    $('#vGrid', el).onchange = e => { V.grid = e.target.checked; V.view && V.view.setGrid && V.view.setGrid(V.grid); };
    $('#vZin', el).onclick = () => V.view && V.view.zoom(0.8); $('#vZout', el).onclick = () => V.view && V.view.zoom(1.25);
    $('#vReset', el).onclick = () => { if (V.base) { Object.assign(V, V.base, { playing: false }); $('#vPlay', el).textContent = 'Play burn'; if (V.view) { V.view.resetCamera(); } update(); } };
    $('#vSend', el).onclick = () => {
      const f = V.F0 || {}; state.mode = 'own'; state.own = Object.assign({}, state.own, { fuel: f.fuel || 'C12', P: V.P, D0: V.D0, regime: V.regime, K: '', Tpk: '', DfMax: '', Qpk: '', DextHot: '', DextCool: '', soot: '', csv: '' });
      state.ctx.O2 = V.O2; state.ctx.ventCmS = V.vent; buildAside(); refresh(); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    $('#vPlay', el).onclick = e => { V.playing = !V.playing; e.target.textContent = V.playing ? 'Pause' : 'Play burn'; if (V.playing) { if (V.prog > 0.97) V.prog = 0; let last = performance.now(); (function loop(now) { if (!V.playing || !V.el.isConnected) return; if (V.el.offsetParent) { V.prog += (now - last) / 1000 / 16; if (V.prog >= 1) { V.prog = 1; V.playing = false; $('#vPlay', el).textContent = 'Play burn'; } update(); } last = now; requestAnimationFrame(loop); })(last); } };
  }
  let rulerKey = '';
  function ruler(cur) {
    const cv = $('#vCanvas', V.el); if (!cv || !cv.clientHeight) return;
    const pxmm = cv.clientHeight / (2 * cur.half), nice = [1, 2, 5, 10, 20, 50].find(n => n * pxmm >= 70) || 50, w = Math.round(nice * pxmm), k = nice + ':' + w;
    if (k !== rulerKey) { rulerKey = k; $('#vRuler', V.el).innerHTML = `<span>${nice} mm</span><i style="width:${w}px"></i>`; }
  }
  function vCompute() {
    const k = [V.P, V.O2, V.D0, V.vent, V.regime, state.ctx.humidity, state.ctx.crewDistM, state.ctx.fuelLoadG, state.ctx.volumeM3, state.ctx.assets, state.ctx.ambientC].join('|');
    if (k === V.cacheKey && V.cache) return V.cache;
    const ctx = Object.assign({}, state.ctx, { O2: V.O2, ventCmS: V.vent }), fuel = (V.F0 && V.F0.fuel) || 'C12';
    const F = E.completeFeatures({ fuel, P: V.P, D0: V.D0, mode: V.regime === 'auto' ? 'hot+cool' : V.regime }, ctx), r = E.assess(F, ctx);
    V.cacheKey = k; return (V.cache = { F, r });
  }
  function update() {
    const el = V.el; if (!el) return;
    const { F, r } = vCompute();
    SL.forEach(([k, l, u]) => { const inp = $('#vs_' + k, el), v = k === 'prog' ? V.prog * 100 : V[k]; if (+inp.value !== v) inp.value = v; $('#vv_' + k, el).textContent = fmt(v, k === 'P' ? 2 : k === 'D0' || k === 'O2' ? 1 : 0) + ' ' + u; });
    $('#vs_reg', el).value = V.regime;
    const fr = g.MGFFlame.frameFrom(F.sim, V.prog, { vent: V.vent, O2: V.O2, P: V.P, soot: F.sootPpm });
    if (V.view) V.view.setFrame(fr.frame);
    const rd = fr.read, d = r.composite - V.score0;
    $('#vBadge', el).innerHTML = `<b>${esc(rd.stage)}</b><span>${fmt(rd.T, 0)} K &middot; flame ${fmt(rd.Df, 1)} mm</span>`;
    $('#vLive', el).innerHTML = `<span class="pill lv${r.level}">${E.LEVELS[r.level]} risk</span><b class="mono">${fmt(r.composite, 0)} / 100</b><span class="muted" style="font-size:.84rem">${Math.abs(d) < 0.5 ? 'same as the analysed case' : (d > 0 ? '+' : '') + fmt(d, 1) + ' vs the analysed case'}. Top driver: ${esc(r.drivers[0].label.toLowerCase())}.</span>`;
    $('#vRead', el).innerHTML = [['Time', fmt(rd.t, 1), 's'], ['Droplet', fmt(rd.D, 2), 'mm'], ['Flame', fmt(rd.Df, 1), 'mm'], ['Temperature', fmt(rd.T, 0), 'K'], ['Radiated', fmt(rd.Q, 1), 'W'], ['Burn rate K', fmt(F.K, 2), 'mm2/s']].map(([a, b, u]) => `<div class="stat"><small>${a}</small><b>${b} <span class="muted" style="font-weight:400;font-size:.74rem">${u}</span></b></div>`).join('');
  }
  function placeViewer(out) {
    const { F, r } = out, ctx = state.ctx;
    const key = [state.mode, state.dsId, state.varId, state.mode === 'own' ? JSON.stringify(state.own) : '', ctx.O2, ctx.ventCmS].join('|');
    V.F0 = F; V.score0 = r.composite;
    const reg = F.mode === 'cool' ? 'cool' : F.mode === 'osc' ? 'osc' : 'auto';
    if (key !== V.key) {
      V.key = key; V.base = { P: +fmt(clampN(F.P, 0.5, 5), 2), O2: ctx.O2, D0: +fmt(clampN(F.D0, 0.5, 6), 1), vent: ctx.ventCmS, regime: reg, prog: 0.08 };
      Object.assign(V, V.base, { playing: false }); V.cacheKey = ''; $('#vPlay', V.el).textContent = 'Play burn';
    }
    const host = $('#results .verdict'); if (host) host.insertAdjacentElement('afterend', V.el);
    V.score0 = vScoreBase(F); update();
  }
  const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
  function vScoreBase(F) { return state.last.r.composite; }

  /* ---------- aside ---------- */
  const field = (id, label, val, attrs = '', hint = '') => `<div class="field"><label for="${id}">${label}${hint ? '<small>' + hint + '</small>' : ''}</label><input id="${id}" type="number" step="any" value="${val}" ${attrs}></div>`;
  function ctxPanel() {
    const c = state.ctx;
    return `<details class="fold panel" id="ctxFold" ${state.ctxOpen === false ? '' : 'open'}><summary>Cabin conditions</summary><div>
      <p class="muted" style="font-size:.82rem;margin-bottom:10px">Your assumptions. They are not in the NASA files and change the result.</p>
      <div class="row2">${field('c_O2', 'Oxygen', c.O2, 'min="15" max="50"', '%')}${field('c_hum', 'Humidity', c.humidity, 'min="0" max="100"', '%')}</div>
      <div class="row2">${field('c_amb', 'Cabin air', c.ambientC, 'min="0" max="80"', 'deg C')}${field('c_vent', 'Airflow', c.ventCmS, 'min="0" max="100"', 'cm/s')}</div>
      <div class="row2">${field('c_vol', 'Free volume', c.volumeM3, 'min="1" max="1000"', 'm3')}${field('c_fuel', 'Fuel on hand', c.fuelLoadG, 'min="0" max="5000"', 'g')}</div>
      ${field('c_crew', 'Distance to nearest crew', c.crewDistM, 'min="0.2" max="30" step="0.1"', 'm')}
      <div class="field"><label for="c_assets">Critical equipment near the flame</label><select id="c_assets">${['none', 'nearby', 'adjacent'].map(o => `<option ${c.assets === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
      <button class="btn sm ghost" id="ctxReset">Reset to defaults</button></div></details>`;
  }
  function buildAside() {
    const a = $('#aside');
    let top;
    if (state.mode === 'demo') {
      const d = ds();
      top = `<div class="panel"><h3>NASA data set</h3><div class="dslist">${D.datasets.map(x => `<button class="dsbtn" data-ds="${x.id}" aria-pressed="${x.id === state.dsId}"><b>${esc(x.short)}</b><small>${esc(x.org)} &middot; ${x.variants.length} condition${x.variants.length > 1 ? 's' : ''}</small></button>`).join('')}</div>
      ${d.variants.length > 1 ? `<div class="field" style="margin-top:12px"><label for="varSel">Condition</label><select id="varSel">${d.variants.map(v => `<option value="${v.id}" ${v.id === state.varId ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>` : ''}
      <p class="muted" style="font-size:.84rem;margin-top:12px">${esc(d.blurb)}</p></div>`;
    } else {
      const o = state.own;
      top = `<div class="panel"><h3>Your conditions</h3>
        <div class="field"><label for="o_fuel">Fuel</label><select id="o_fuel">${Object.entries(CFG.fuels).map(([k, f]) => `<option value="${k}" ${o.fuel === k ? 'selected' : ''}>${f.name}${k === 'OTHER' ? '' : ' (' + k + ')'}</option>`).join('')}</select></div>
        <div class="row2">${field('o_P', 'Pressure', o.P, 'min="0.1" max="20"', 'atm')}${field('o_D0', 'Droplet size', o.D0, 'min="0.05" max="12"', 'mm')}</div>
        <div class="field"><label for="o_reg">Flame regime</label><select id="o_reg">${[['auto', 'Automatic (from droplet size)'], ['cool', 'Steady cool flame'], ['osc', 'Oscillating cool flame']].map(([k, n]) => `<option value="${k}" ${o.regime === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <details class="fold" style="margin-top:6px" ${(o.K !== '' || o.Tpk !== '' || o.csv) ? 'open' : ''}><summary style="font-size:.92rem">Measured values (optional)</summary><div>
          <p class="muted" style="font-size:.8rem;margin-bottom:8px">Leave blank and the model estimates it.</p>
          <div class="row2">${field('o_K', 'K', o.K, 'min="0"', 'mm2/s')}${field('o_Tpk', 'Peak T', o.Tpk, 'min="300"', 'K')}</div>
          <div class="row2">${field('o_Df', 'Flame diam.', o.DfMax, 'min="0"', 'mm')}${field('o_Q', 'Radiated', o.Qpk, 'min="0"', 'W')}</div>
          <div class="row2">${field('o_DH', 'Hot Dext', o.DextHot, 'min="0"', 'mm')}${field('o_DC', 'Cool Dext', o.DextCool, 'min="0"', 'mm')}</div>
          ${field('o_soot', 'Flame soot', o.soot, 'min="0"', 'ppm')}
          <div class="field"><label for="o_csv">Time series (CSV)<small>optional</small></label><textarea id="o_csv" placeholder="time,diameter,flame_diameter,tmax,radiance&#10;0,4.5,4,1800,0&#10;...">${esc(o.csv)}</textarea></div>
          <div class="row2"><button class="btn sm ghost" id="csvSample">Fill sample</button><button class="btn sm ghost" id="csvClear">Clear</button></div></div></details>
        <button class="btn" id="runOwn" style="margin-top:14px;width:100%;justify-content:center">Run analysis</button>
        <p id="ownMsg" class="muted" style="font-size:.82rem;margin-top:8px">Pre-filled with an example: a 4.5 mm n-dodecane droplet at 1 atm.</p></div>`;
    }
    a.innerHTML = top + ctxPanel();
    wireAside();
  }
  function wireAside() {
    const a = $('#aside');
    $$('.dsbtn', a).forEach(b => b.onclick = () => select(b.dataset.ds));
    const vs = $('#varSel'); if (vs) vs.onchange = () => { state.varId = vs.value; refresh(); };
    const bind = (id, key, num = true) => { const el = $('#' + id); if (!el) return; el.oninput = el.onchange = () => { state.ctx[key] = num ? (+el.value || 0) : el.value; debounced(); }; };
    bind('c_O2', 'O2'); bind('c_hum', 'humidity'); bind('c_amb', 'ambientC'); bind('c_vent', 'ventCmS'); bind('c_vol', 'volumeM3'); bind('c_fuel', 'fuelLoadG'); bind('c_crew', 'crewDistM'); bind('c_assets', 'assets', false);
    const cf = $('#ctxFold'); cf.ontoggle = () => state.ctxOpen = cf.open;
    $('#ctxReset').onclick = () => { state.ctx = Object.assign({}, CFG.defaultContext); buildAside(); refresh(); };
    if (state.mode === 'own') {
      const m = { o_fuel: 'fuel', o_P: 'P', o_D0: 'D0', o_reg: 'regime', o_K: 'K', o_Tpk: 'Tpk', o_Df: 'DfMax', o_Q: 'Qpk', o_DH: 'DextHot', o_DC: 'DextCool', o_soot: 'soot', o_csv: 'csv' };
      Object.entries(m).forEach(([id, k]) => { const el = $('#' + id); el.oninput = el.onchange = () => { state.own[k] = el.value; }; });
      $('#runOwn').onclick = () => { $('#ownMsg').textContent = ''; refresh(); };
      $('#csvSample').onclick = () => {
        const s = E.simulate({ fuel: state.own.fuel, P: +state.own.P || 1, D0: +state.own.D0 || 4.5, O2: state.ctx.O2 }), n = s.t.length, step = Math.floor(n / 60) || 1;
        const rows = ['time,diameter,flame_diameter,tmax,radiance']; for (let i = 0; i < n; i += step) rows.push([s.t[i].toFixed(3), s.D[i].toFixed(3), s.Df[i].toFixed(2), s.T[i].toFixed(0), s.Q[i].toFixed(2)].join(','));
        state.own.csv = rows.join('\n'); $('#o_csv').value = state.own.csv;
      };
      $('#csvClear').onclick = () => { state.own.csv = ''; $('#o_csv').value = ''; };
    }
  }
  let dt; function debounced() { clearTimeout(dt); dt = setTimeout(refresh, 160); }

  function syncMode() {
    $$('[data-tab]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === state.mode));
    $$('[data-depth]').forEach(b => b.setAttribute('aria-pressed', b.dataset.depth === state.depth));
  }
  function refresh() { if (!state.built) return; syncMode(); renderResults(); }

  function render() {
    const root = $('#view-lab'), L = C.modeling;
    root.innerHTML = `
      <div class="lab-head"><h1 style="font-size:clamp(1.9rem,4vw,2.8rem)">${esc(L.heading)}</h1><p>${esc(L.lead)}</p></div>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Data source"><button data-tab="demo" aria-pressed="true">${esc(L.demoTab)}</button><button data-tab="own" aria-pressed="false">${esc(L.ownTab)}</button></div>
        <span class="sp"></span>
        <div class="seg" role="group" aria-label="Depth of analysis"><button data-depth="summary" aria-pressed="true">Summary analysis</button><button data-depth="detailed" aria-pressed="false">Detailed analysis</button></div>
      </div>
      <div class="lab"><aside class="aside" id="aside" aria-label="Inputs"></aside><div class="results" id="results" aria-live="polite"></div></div>`;
    state.built = true; buildViewer();
    $$('[data-tab]', root).forEach(b => b.onclick = () => { state.mode = b.dataset.tab; buildAside(); refresh(); });
    $$('[data-depth]', root).forEach(b => b.onclick = () => { state.depth = b.dataset.depth; syncMode(); renderResults(); });
    A.themeListeners.push(() => { if (!$('#view-lab').classList.contains('hidden-view')) drawTree(state.last.r); });
    buildAside(); refresh();
  }
  g.MGFLab = { render, refresh, select };
})(window);
