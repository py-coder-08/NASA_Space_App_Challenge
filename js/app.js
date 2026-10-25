/* Shared helpers, router, charts and the Dashboard page */
(function (g) {
  const C = g.MGF_CONTENT, CFG = g.MGF_CONFIG, D = g.MGF_DATA, E = g.MGF;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = E.fmt;
  const themeListeners = [];

  /* ---------- theme ---------- */
  function isDark() {
    const t = document.documentElement.dataset.theme;
    return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function initTheme() {
    try { const t = localStorage.getItem('mgf-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    $('#themeBtn').addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('mgf-theme', next); } catch (e) {}
      themeListeners.forEach(f => f());
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => themeListeners.forEach(f => f()));
  }

  /* ---------- charts ---------- */
  const live = [];
  function palette() { return isDark() ? { expt: '#5bc6ff', model: '#ffaa4c', expt2: '#c58bff', model2: '#5ee0a8' } : { expt: '#0a7cc0', model: '#b85f00', expt2: '#7d3fc9', model2: '#12804f' }; }
  function mkChart(canvas, spec) {
    if (!g.Chart) { canvas.parentNode.innerHTML = '<p class="muted">Charts need an internet connection to load the chart library.</p>'; return null; }
    const pal = palette(), txt = css('--muted'), grid = css('--line');
    const sets = spec.series.map(s => {
      const col = spec.colors ? spec.colors[s.kind] || pal[s.kind] : pal[s.kind] || pal.expt;
      const pts = s.kind.startsWith('expt');
      return { label: s.label, data: s.data.map(p => ({ x: p[0], y: p[1] })), borderColor: col, backgroundColor: col, showLine: !pts || !!s.forceLine, pointRadius: pts ? 3 : 0, pointHoverRadius: 5, borderWidth: 2, tension: 0.15, fill: false };
    });
    const ch = new g.Chart(canvas, {
      type: 'scatter', data: { datasets: sets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { color: txt, boxWidth: 12, boxHeight: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + (+c.parsed.y.toPrecision(4)) + ' at ' + (+c.parsed.x.toPrecision(4)) } } },
        scales: {
          x: { type: spec.xlog ? 'logarithmic' : 'linear', title: { display: true, text: spec.x, color: txt }, ticks: { color: txt }, grid: { color: grid } },
          y: { title: { display: true, text: spec.y, color: txt }, ticks: { color: txt }, grid: { color: grid }, min: spec.ymin }
        }
      }
    });
    live.push({ ch, canvas, spec });
    return ch;
  }
  function clearCharts(root) {
    for (let i = live.length - 1; i >= 0; i--) if (!root || root.contains(live[i].canvas) || !document.body.contains(live[i].canvas)) { live[i].ch.destroy(); live.splice(i, 1); }
  }
  themeListeners.push(() => { live.slice().forEach(l => { const c = l.canvas, sp = l.spec; l.ch.destroy(); live.splice(live.indexOf(l), 1); mkChart(c, sp); }); });

  /* ---------- ranking data ---------- */
  let rankCache = null;
  function rankAll() {
    if (rankCache) return rankCache;
    const rows = [];
    for (const d of D.datasets) for (const v of d.variants) {
      const F = E.completeFeatures(v, {}); const r = E.assess(F, {});
      rows.push({ ds: d, v, F, r, score: r.composite, level: r.level });
    }
    rows.sort((a, b) => b.score - a.score);
    return (rankCache = rows);
  }

  /* ---------- hero sphere ---------- */
  function startSphere(canvas) {
    const ctx = canvas.getContext('2d'); let raf, t0 = performance.now();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(now) {
      const w = canvas.clientWidth, h = canvas.clientHeight, t = reduce ? 0 : (now - t0) / 1000;
      const cx = w / 2, cy = h / 2 - 8, R = Math.min(w, h) * 0.44;
      ctx.clearRect(0, 0, w, h);
      const cool = css('--cool'), hot = css('--hot'), muted = css('--muted'), line = css('--line'), dark = isDark();
      // cool flame halo
      const ro = R * (0.97 + 0.03 * Math.sin(t * 1.4));
      let gr = ctx.createRadialGradient(cx, cy, R * 0.35, cx, cy, ro);
      gr.addColorStop(0, cool + '00'); gr.addColorStop(0.7, cool + (dark ? '30' : '38')); gr.addColorStop(0.93, cool + (dark ? '66' : '70')); gr.addColorStop(1, cool + '00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, ro, 0, 7); ctx.fill();
      // soot shell
      const rs = R * 0.66; gr = ctx.createRadialGradient(cx, cy, rs * 0.7, cx, cy, rs * 1.05);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.6, dark ? 'rgba(2,4,10,.55)' : 'rgba(40,40,60,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, rs * 1.05, 0, 7); ctx.fill();
      // hot flame shell
      const rh = R * (0.5 + 0.012 * Math.sin(t * 2.1 + 1));
      gr = ctx.createRadialGradient(cx, cy, rh * 0.55, cx, cy, rh * 1.12);
      gr.addColorStop(0, hot + '00'); gr.addColorStop(.62, hot + 'aa'); gr.addColorStop(.82, hot + 'ee'); gr.addColorStop(1, hot + '00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, rh * 1.12, 0, 7); ctx.fill();
      // droplet
      const rd = R * 0.17; gr = ctx.createRadialGradient(cx - rd * .3, cy - rd * .3, 1, cx, cy, rd);
      gr.addColorStop(0, dark ? '#ffffff' : '#ffffff'); gr.addColorStop(1, dark ? '#9fb4d6' : '#5c718f');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, rd, 0, 7); ctx.fill();
      // callouts
      ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = muted; ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.textBaseline = 'middle';
      const notes = [[-0.78, 'cool flame', ro], [-0.32, 'hot flame', rh * 1.02], [0.5, 'fuel droplet', rd]];
      notes.forEach(([a, label, rr], i) => {
        const ang = a * Math.PI, x0 = cx + Math.cos(ang) * rr, y0 = cy + Math.sin(ang) * rr; const x1 = cx + R * 1.08 * (i === 2 ? 0.95 : 1), y1 = y0;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 > cx ? w - 4 - ctx.measureText(label).width - 8 : 4 + ctx.measureText(label).width + 8, y1); ctx.stroke();
        ctx.textAlign = x1 > cx ? 'right' : 'left'; ctx.fillText(label, x1 > cx ? w - 4 : 4, y1 - 9);
      });
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    size(); frame(performance.now());
    addEventListener('resize', () => { size(); if (reduce) frame(0); });
    themeListeners.push(() => { if (reduce) frame(0); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) raf = requestAnimationFrame(frame); });
  }


  /* ---------- hero: live 3D flame that cycles through a burn ---------- */
  function startHero() {
    const stage = $('#heroStage'), canvas = $('#heroCanvas');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let view = null;
    try { view = g.MGFFlame.create(canvas, { auto: !reduce, lock: true }); } catch (e) { view = null; }
    if (!view || !view.supported) {
      stage.innerHTML = '<canvas id="sphere" aria-label="A burning fuel droplet in microgravity: a fuel droplet at the centre, a hot flame shell, a soot shell and a faint cool-flame halo."></canvas><figcaption class="cap">A droplet flame in microgravity is a sphere</figcaption>';
      startSphere($('#sphere')); return;
    }
    const sim = E.simulate({ fuel: 'C12', P: 1, O2: 21, D0: 4.5, regime: 'auto' }), f = sim.t1 / sim.tEnd, t0 = performance.now(), LOOP = 22000;
    (function tick(now) {
      if (!stage.isConnected) return;
      if (canvas.offsetParent !== null) {
        const u = reduce ? 0.12 : ((now - t0) % LOOP) / LOOP, prog = u < 0.4 ? f * u / 0.4 : f + (1 - f) * (u - 0.4) / 0.6;
        const fr = g.MGFFlame.frameFrom(sim, prog, { O2: 21, P: 1, vent: 0, soot: 10 });
        view.setFrame(fr.frame);
        $('#chipS').textContent = fr.read.stage; $('#chipT').textContent = fmt(fr.read.T, 0) + ' K'; $('#chipD').textContent = fmt(fr.read.Df, 0) + ' mm'; $('#chipF').textContent = fmt(fr.read.D, 1) + ' mm';
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  /* ---------- dashboard ---------- */
  function renderDashboard() {
    const root = $('#view-dashboard'), rows = rankAll(), VIS = g.MGFVis;
    const nFiles = D.datasets.length, nCond = rows.length;
    // numbers behind the headline findings
    const kExp = { lo: 0.323, hi: 0.515 };
    const dK = D.datasets.find(d => d.id === 'D7').variants, k05 = dK.find(v => v.P === 0.5).K, k5 = dK.find(v => v.P === 5).K;
    const d8 = D.datasets.find(d => d.id === 'D8').variants, c05 = d8.find(v => v.P === 0.5).DextCool, c3 = d8.find(v => v.P === 3).DextCool;
    const d6 = D.datasets.find(d => d.id === 'D6').variants, q05 = d6[0].Qpk, q5 = d6[1].Qpk;
    root.innerHTML = `
    <section class="hero2">
      <div class="h2-copy">
        <h1>${esc(C.hero.title)}</h1>
        <p class="lead">${esc(C.hero.lead)}</p>
        <div class="actions"><a class="btn glow" href="#lab">${esc(C.hero.primaryButton)}</a><button class="btn ghost" id="heroTour">${esc(C.hero.secondaryButton)}</button><a class="btn ghost" href="#method">${esc(C.hero.tertiaryButton)}</a></div>
        <div class="h2-stats">
          <div><b>${nFiles}</b><span>NASA files analysed</span></div>
          <div><b>${nCond}</b><span>burn conditions scored</span></div>
          <div><b>6</b><span>sensor channels</span></div>
          <div><b>6</b><span>decision steps</span></div>
        </div>
      </div>
      <div class="h2-art">
        <svg class="orbits" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="rgba(160,190,235,.22)" stroke-width="1"><circle cx="200" cy="200" r="196"/><circle cx="200" cy="200" r="150" stroke-dasharray="2 6"/><ellipse cx="200" cy="200" rx="196" ry="58" transform="rotate(-24 200 200)"/></g><g class="spin"><circle cx="396" cy="200" r="4.5" fill="#5bc6ff"/><circle cx="52" cy="98" r="3" fill="#ffb347"/></g></svg>
        <figure class="stage sphere" id="heroStage" style="margin:0"><canvas id="heroCanvas" aria-label="Live 3D model of a burning fuel droplet in microgravity. The flame is a sphere. Drag to rotate."></canvas></figure>
        <div class="chip c1"><span>Stage</span><b id="chipS">Hot flame</b></div>
        <div class="chip c2"><span>Flame temperature</span><b id="chipT">1,900 K</b></div>
        <div class="chip c3"><span>Flame diameter</span><b id="chipD">30 mm</b></div>
        <div class="chip c4"><span>Fuel droplet</span><b id="chipF">4.5 mm</b></div>
        <p class="h2-cap">${esc(C.hero.stageCaption)}</p>
      </div>
    </section>

    <section class="band" id="benefits">
      <div class="sec-head"><h2>${esc(C.benefits.heading)}</h2><p>${esc(C.benefits.lead)}</p></div>
      <div class="bento">${C.benefits.items.map((i, k) => { const m = [['radar', 'eye'], ['tree', 'tree'], ['burn', 'data'], ['sliders', 'sliders'], ['depth', 'layers'], ['report', 'report']][k] || ['burn', 'data']; return `<article class="bt bt${k}"><div class="bt-vis">${VIS[m[0]]()}</div><div class="bt-tx"><span class="bt-ic">${VIS.icons[m[1]]}</span><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></div></article>`; }).join('')}</div>
    </section>

    <section class="band" id="different">
      <div class="sec-head"><h2>${esc(C.special.heading)}</h2><p>${esc(C.special.lead)}</p></div>
      <div class="duel">
        <figure class="duel-a">${VIS.earth()}<figcaption><b>${esc(C.special.col1)}</b><span>${esc(C.special.earthCaption)}</span></figcaption></figure>
        <figure class="duel-b">${VIS.space()}<figcaption><b>${esc(C.special.col2)}</b><span>${esc(C.special.spaceCaption)}</span></figcaption></figure>
      </div>
      <div class="contrasts">${C.special.rows.map(r => `<div class="cx"><s>${esc(r[0])}</s><p>${esc(r[1])}</p></div>`).join('')}</div>
    </section>

    <section class="band">
      <div class="sec-head"><h2>${esc(C.why.heading)}</h2></div>
      <div class="why">${C.why.items.map(i => `<div><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></div>`).join('')}</div>
    </section>

    <section class="band" id="ranking">
      <div class="sec-head"><h2>${esc(C.ranking.heading)}</h2><p>${esc(C.ranking.lead)}</p></div>
      <div class="rank-tools">
        <div class="seg" role="group" aria-label="Ranking view"><button id="rkBest" aria-pressed="true">Highest per file</button><button id="rkAll" aria-pressed="false">All ${nCond} conditions</button></div>
        <span class="muted" style="font-size:.85rem">Default cabin: ${CFG.defaultContext.O2} % O2, ${CFG.defaultContext.crewDistM} m from crew, ${CFG.defaultContext.fuelLoadG} g of fuel in ${CFG.defaultContext.volumeM3} m3.</span>
      </div>
      <div class="rank" id="rankList"></div>
      <p class="muted" style="font-size:.84rem;margin-top:12px">Ticks on each bar mark the cut-offs: Low below ${CFG.levels.low}, Moderate below ${CFG.levels.moderate}, High below ${CFG.levels.high}, Critical above. The bar scale runs 0 to 80.</p>
    </section>

    <section class="band">
      <div class="sec-head"><h2>What the data says about pressure and fuel</h2><p>Three patterns that drive most of the ranking above.</p></div>
      <div class="grid g3">
        <div class="panel chart-card"><h4>Burning-rate constant vs pressure</h4><div class="chart"><canvas id="ch1"></canvas></div><p>Droplets are consumed faster as pressure rises.</p></div>
        <div class="panel chart-card"><h4>Extinction diameter vs pressure</h4><div class="chart"><canvas id="ch2"></canvas></div><p>Hot flames go out at a near-fixed size. Cool flames burn on to smaller droplets at higher pressure.</p></div>
        <div class="panel chart-card"><h4>Model risk score vs pressure</h4><div class="chart"><canvas id="ch3"></canvas></div><p>The same score method applied to three fuels in the default cabin.</p></div>
      </div>
      <div class="finds">
        <div class="find"><b>+${fmt((k5 / k05 - 1) * 100, 0)} %</b><span>Cool-flame burning-rate constant from 0.5 atm (${fmt(k05, 2)} mm2/s) to 5 atm (${fmt(k5, 2)} mm2/s), experiment means.</span></div>
        <div class="find"><b>${fmt(c05, 2)} to ${fmt(c3, 2)} mm</b><span>Cool-flame extinction diameter from 0.5 to 3 atm. At 3 atm the cool flame burns the droplet to nothing.</span></div>
        <div class="find"><b>+${fmt((q5 / q05 - 1) * 100, 0)} %</b><span>Peak radiated power from 0.5 atm (${fmt(q05, 0)} W) to 5 atm (${fmt(q5, 0)} W) for a 4.5 mm n-dodecane droplet.</span></div>
      </div>
    </section>

    <section class="band">
      <div class="sec-head"><h2>${esc(C.steps.heading)}</h2></div>
      <div class="flow">${C.steps.items.map((s, i) => `<div><h3>${i + 1}. ${esc(s.title)}</h3><p>${esc(s.body)}</p></div>`).join('')}</div>
    </section>

    <section class="band" id="library">
      <div class="sec-head"><h2>${esc(C.library.heading)}</h2><p>${esc(C.library.lead)}</p></div>
      <div class="lib">${D.datasets.map(d => `<div class="panel"><div class="row" style="margin:0"><span class="tag">${esc(d.org)}</span><span class="tag">${d.variants.length} condition${d.variants.length > 1 ? 's' : ''}</span></div><h4>${esc(d.title)}</h4><p>${esc(d.blurb)}</p><div class="file">${esc(d.file)}</div><div class="row"><button class="btn sm ghost" data-open="${d.id}">Open in lab</button></div></div>`).join('')}</div>
    </section>

    <section class="band"><div class="sec-head"><h2>${esc(C.limits.heading)}</h2></div><p class="note">${esc(C.limits.body)}</p></section>

    <section class="band-cta"><div class="cta-glow" aria-hidden="true"></div><div><h2>${esc(C.cta.heading)}</h2><p>${esc(C.cta.body)}</p></div><div class="actions" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="#lab">${esc(C.cta.button)}</a><a class="btn ghost" href="#refs">${esc(C.cta.second)}</a></div></section>`;

    // ranking list
    const list = $('#rankList'); let showAll = false;
    function drawRank() {
      const seen = new Set(), items = showAll ? rows : rows.filter(r => !seen.has(r.ds.id) && seen.add(r.ds.id));
      const max = 80, L = CFG.levels;
      list.innerHTML = items.map((r, i) => `<button class="rrow" data-ds="${r.ds.id}" data-v="${r.v.id}"><span class="pos">${i + 1}</span>
        <span class="nm">${esc(r.ds.short)}<small>${esc(r.v.label)}</small></span>
        <span class="bar"><i class="fill${r.level}" style="width:${Math.min(100, r.score / max * 100)}%"></i><u style="left:${L.low / max * 100}%"></u><u style="left:${L.moderate / max * 100}%"></u><u style="left:${L.high / max * 100}%"></u></span>
        <span class="sc"><b>${fmt(r.score, 0)}</b><span class="pill lv${r.level}">${E.LEVELS[r.level]}</span></span></button>`).join('');
    }
    drawRank();
    $('#rkBest').onclick = () => { showAll = false; $('#rkBest').setAttribute('aria-pressed', 'true'); $('#rkAll').setAttribute('aria-pressed', 'false'); drawRank(); };
    $('#rkAll').onclick = () => { showAll = true; $('#rkAll').setAttribute('aria-pressed', 'true'); $('#rkBest').setAttribute('aria-pressed', 'false'); drawRank(); };
    list.addEventListener('click', e => { const b = e.target.closest('.rrow'); if (b) openLab(b.dataset.ds, b.dataset.v); });
    root.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openLab(b.dataset.open); });

    // charts
    mkChart($('#ch1'), D.datasets.find(d => d.id === 'D7').charts[0]);
    mkChart($('#ch2'), D.datasets.find(d => d.id === 'D8').charts[0]);
    const Ps = [0.5, 0.75, 1, 1.25, 2, 3, 5];
    const ser = [['C12', 'n-dodecane', 'expt', 4.4], ['C10', 'n-decane', 'model', 4.1], ['C7', 'n-heptane', 'expt2', 3.7]].map(([f, nm, kind, d0]) => ({
      label: nm, kind, forceLine: true, data: Ps.map(P => [P, E.assess(E.completeFeatures({ fuel: f, P, D0: d0, mode: 'hot+cool' }, {}), {}).composite])
    }));
    mkChart($('#ch3'), { x: 'Pressure (atm)', y: 'Risk score (0-100)', series: ser, xlog: true });
    startHero();
    $('#heroTour').onclick = () => openLab(null, null, true);
  }

  /* ---------- router ---------- */
  const views = { dashboard: { el: '#view-dashboard', render: renderDashboard, done: false }, lab: { el: '#view-lab', render: () => g.MGFLab.render(), done: false }, method: { el: '#view-method', render: () => g.MGFMethod.render(), done: false }, refs: { el: '#view-refs', render: () => g.MGFRefs.render(), done: false } };
  function route() {
    const key = (location.hash || '#dashboard').slice(1); const name = views[key] ? key : (key === 'ranking' || key === 'library' ? 'dashboard' : 'dashboard');
    for (const [k, v] of Object.entries(views)) $(v.el).classList.toggle('hidden-view', k !== name);
    $$('[data-nav]').forEach(a => a.removeAttribute('aria-current')); const a = $(`[data-nav="${name}"]`); if (a) a.setAttribute('aria-current', 'page');
    const v = views[name]; const first = !v.done; if (!v.done) { v.render(); v.done = true; }
    else if (name === 'lab') g.MGFLab.refresh();
    g.MGFTour.fabFor(name);
    if (name === 'lab' && (first || pendingTour)) { const f = pendingTour; pendingTour = false; if (f) setTimeout(() => g.MGFTour.start('lab'), 500); else g.MGFTour.auto('lab'); }
    if (key === 'ranking' || key === 'library') { const t = document.getElementById(key); if (t) t.scrollIntoView(); } else window.scrollTo(0, 0);
  }
  let pendingTour = false;
  function openLab(dsId, varId, tour) { if (dsId) g.MGFLab.select(dsId, varId); pendingTour = !!tour; if (location.hash === '#lab') route(); else location.hash = 'lab'; }

  function start() {
    $('#siteName').textContent = C.site.name; document.title = C.site.name;
    $('#footer').innerHTML = `<b>${esc(C.site.name)}</b> &middot; ${esc(C.site.tagline)}<br>${esc(C.site.footer)}`;
    initTheme(); addEventListener('hashchange', route); route();
  }
  g.MGFApp = { start, esc, $, $$, mkChart, clearCharts, rankAll, openLab, themeListeners, css, isDark, palette };
})(window);
