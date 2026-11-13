/* Cabin plan: upload a map or layout, mark exits, extinguishers, detectors, hazards and crew
   stations, enter physical conditions, and get distance and escape checks. Saved in this browser. */
(function (g) {
  const KEY = 'mgf-plan-v1', esc = s => g.MGFApp.esc(s);
  const TYPES = { exit: ['Exit', 'E'], ext: ['Extinguisher', 'X'], det: ['Detector', 'D'], haz: ['Fuel or hazard', 'H'], crew: ['Crew station', 'C'] };
  const DEF = { vol: 50, crew: 3, exits: 2, fuel: 15, O2: 21, P: 101.3, vent: 15, width: '', speed: 0.5, door: 3, crewDist: 4 };
  let P = { img: null, ar: 0.6, pins: [], c: Object.assign({}, DEF) }, note = '', root = null;
  const uid = () => Math.random().toString(36).slice(2, 8);
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j) P = Object.assign(P, j, { c: Object.assign({}, DEF, j.c || {}) }); } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); note = ''; } catch (e) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, P, { img: null }))); } catch (e2) {} note = 'The plan image is too large to save in this browser. It stays for this visit, and your markers and conditions are saved.'; } }

  function html() {
    const f = (id, label, v, step) => `<label>${label}<input type="number" id="pl_${id}" value="${v}" step="${step || 'any'}" min="0"></label>`;
    return `<section class="band" id="plan"><div class="sec-head"><h2>Cabin plan and physical conditions</h2><p>Upload a map or layout, mark the exits, extinguishers, detectors, hazards and crew stations, and enter the cabin's physical conditions. Ember Watch checks distances and escape time and can send the conditions to the modeling lab. Saved in this browser only.</p></div>
    <div class="plan-grid">
      <div class="panel plan-map">
        <div class="plan-tools"><label class="btn sm upl">Upload map or layout<input type="file" id="plFile" accept="image/*" hidden></label>
          <select id="plType" aria-label="Marker type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
          <button class="btn sm ghost" id="plCenter" type="button">Place at centre</button><button class="btn sm ghost" id="plClear" type="button">Remove plan</button></div>
        <div class="plan-stage" id="plStage"></div>
        <p class="muted" style="font-size:.85rem;margin-top:8px">Choose a marker type, then click the plan. Images only (PNG, JPG, SVG, WebP). Export a PDF floor plan as an image first.</p>
        <p class="caveat" id="plNote" role="status"></p>
        <ul class="pinlist" id="plPins"></ul>
      </div>
      <div class="panel plan-form"><h4>Physical conditions</h4>
        <div class="pf">${f('vol', 'Free volume (m3)', P.c.vol)}${f('crew', 'Crew', P.c.crew, 1)}${f('exits', 'Exits', P.c.exits, 1)}${f('fuel', 'Fuel load (g)', P.c.fuel)}${f('O2', 'Oxygen (%)', P.c.O2, .1)}${f('P', 'Pressure (kPa)', P.c.P, .1)}${f('vent', 'Airflow (cm/s)', P.c.vent)}${f('crewDist', 'Crew to fire source (m)', P.c.crewDist)}</div>
        <h4 style="margin-top:14px">Plan scale and escape</h4>
        <div class="pf">${f('width', 'Plan width (m)', P.c.width)}${f('speed', 'Crew speed (m/s)', P.c.speed)}${f('door', 'Door or hatch time (s)', P.c.door)}</div>
        <div id="plOut" class="plout" aria-live="polite"></div>
        <button class="btn" id="plUse" type="button">Use these conditions in the lab</button>
      </div></div></section>`;
  }

  const pinsOf = t => P.pins.filter(p => p.t === t);
  function dist(a, b) { const W = +P.c.width; if (!(W > 0)) return null; return Math.hypot((a.x - b.x) * W, (a.y - b.y) * W * P.ar); }
  const nearest = (p, list) => { let m = null; list.forEach(q => { const d = dist(p, q); if (d != null && (m == null || d < m)) m = d; }); return m; };

  function out() {
    const c = P.c, el = root.querySelector('#plOut'), r = [], pO = c.O2 / 100 * c.P, ratio = pO / (0.2095 * 101.325);
    const add = (ok, t) => r.push(`<li class="${ok ? 'ok' : 'warn'}"><span aria-hidden="true">${ok ? '&#10003;' : '!'}</span>${t}</li>`);
    add(ratio <= 1.15, `Oxygen partial pressure ${pO.toFixed(1)} kPa, ${ratio.toFixed(2)}x air at sea level${ratio > 1.15 ? '. Enriched atmosphere: fires spread faster.' : '.'}`);
    add(c.vol / Math.max(1, c.crew) >= 10, `${(c.vol / Math.max(1, c.crew)).toFixed(1)} m3 of free volume per crew member.`);
    const ex = Math.max(pinsOf('exit').length, 0), nEx = ex || c.exits;
    add(nEx >= 2, nEx >= 2 ? `${nEx} exits${ex ? ' marked' : ' entered'}.` : `Only ${nEx} exit. Aim for two independent routes (Mir smoke blocked one).`);
    if (!pinsOf('ext').length) add(false, 'No extinguisher marked on the plan.');
    if (!(+c.width > 0)) r.push('<li class="info">Enter the plan width in metres to get distances and escape times.</li>');
    else {
      pinsOf('crew').forEach((p, i) => { const d = nearest(p, pinsOf('exit')); if (d == null) return; const t = d / Math.max(0.05, +c.speed) + (+c.door || 0); add(t <= 30, `Crew station ${i + 1}: ${d.toFixed(1)} m to the nearest exit, about ${t.toFixed(0)} s to get out${t > 30 ? '. Slower than the 30 s review threshold (assumed).' : '.'}`); });
      pinsOf('haz').forEach((p, i) => { const d = nearest(p, pinsOf('ext')); if (d != null) add(d <= 10, `Hazard ${i + 1}: nearest extinguisher ${d.toFixed(1)} m away${d > 10 ? ', beyond the 10 m review threshold (assumed).' : '.'}`); });
    }
    const hz = pinsOf('haz'), cr = pinsOf('crew'); let md = null; hz.forEach(h => cr.forEach(q => { const d = dist(h, q); if (d != null && (md == null || d < md)) md = d; }));
    if (md != null) r.push(`<li class="info">Closest hazard to a crew station: ${md.toFixed(1)} m. This is sent to the lab as crew distance.</li>`);
    el.innerHTML = '<ul>' + r.join('') + '</ul><p class="muted" style="font-size:.8rem">Speed, door time and the 30 s and 10 m thresholds are assumptions for review, not NASA limits.</p>';
    el._md = md;
  }

  function stage() {
    const st = root.querySelector('#plStage');
    if (!P.img) st.innerHTML = '<div class="plan-empty"><b>No plan yet</b><span>Upload a floor plan, cabin sketch or module layout to start marking it.</span></div>';
    else st.innerHTML = `<div class="plan-wrap" id="plWrap"><img src="${P.img}" alt="Uploaded cabin plan" draggable="false">${P.pins.map((p, i) => `<button type="button" class="pin ${p.t}" style="left:${(p.x * 100).toFixed(2)}%;top:${(p.y * 100).toFixed(2)}%" data-pin="${p.id}" aria-label="${esc(TYPES[p.t][0])} ${i + 1}, remove" title="${esc(TYPES[p.t][0])} (click to remove)">${TYPES[p.t][1]}</button>`).join('')}</div>`;
    root.querySelector('#plPins').innerHTML = P.pins.length ? Object.keys(TYPES).map(t => { const n = pinsOf(t).length; return n ? `<li><span class="pin ${t} static">${TYPES[t][1]}</span>${esc(TYPES[t][0])}: ${n}</li>` : ''; }).join('') : '';
    root.querySelector('#plNote').textContent = note; out();
  }

  function addPin(x, y) { P.pins.push({ id: uid(), t: root.querySelector('#plType').value, x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }); save(); stage(); }

  function mount(el) {
    root = el; load(); root.innerHTML = html(); stage();
    root.querySelector('#plFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 1100 / im.width), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height); P.img = cv.toDataURL('image/jpeg', .82); P.ar = cv.height / cv.width; P.pins = []; save(); stage(); }; im.onerror = () => { note = 'That file could not be read as an image. Try PNG or JPG.'; stage(); }; im.src = rd.result; };
      rd.readAsDataURL(f); e.target.value = '';
    };
    root.querySelector('#plStage').addEventListener('click', e => {
      const pin = e.target.closest('[data-pin]'); if (pin) { P.pins = P.pins.filter(p => p.id !== pin.dataset.pin); save(); stage(); return; }
      const w = e.target.closest('#plWrap'); if (!w) return; const r = w.getBoundingClientRect(); addPin((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });
    root.querySelector('#plCenter').onclick = () => { if (P.img) addPin(.5, .5); else { note = 'Upload a plan first.'; stage(); } };
    root.querySelector('#plClear').onclick = () => { P.img = null; P.pins = []; save(); stage(); };
    Object.keys(DEF).forEach(k => { const i = root.querySelector('#pl_' + k); if (i) i.oninput = () => { P.c[k] = i.value === '' ? '' : +i.value; save(); out(); }; });
    root.querySelector('#plUse').onclick = () => { const c = P.c, md = root.querySelector('#plOut')._md; g.MGFLab.setContext({ O2: +c.O2, ventCmS: +c.vent, volumeM3: +c.vol, fuelLoadG: +c.fuel, crewDistM: md != null ? +md.toFixed(1) : +c.crewDist }); location.hash = 'lab'; };
  }
  g.MGFPlan = { mount };
})(window);
