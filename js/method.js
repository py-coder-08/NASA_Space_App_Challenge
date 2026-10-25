/* Methodology page: how the risk is worked out */
(function (g) {
  const A = g.MGFApp, E = g.MGF, C = g.MGF_CONTENT, CFG = g.MGF_CONFIG, D = g.MGF_DATA;
  const { esc, $, $$ } = A, fmt = E.fmt, W = CFG.weights, TR = CFG.triggers;

  function ramp(lo, hi, unit) {
    const span = hi - lo, a = lo - span * 0.35, b = hi + span * 0.35, X = v => 12 + (v - a) / (b - a) * 196;
    return `<svg class="mini" viewBox="0 0 220 74" role="img" aria-label="Score is 0 at ${lo} ${unit} and 1 at ${hi} ${unit}"><line x1="12" y1="58" x2="208" y2="58" stroke="var(--line)"/><path d="M12 58 L${X(lo)} 58 L${X(hi)} 12 L208 12" fill="none" stroke="var(--cool)" stroke-width="2.4"/>
      <line x1="${X(lo)}" y1="58" x2="${X(lo)}" y2="64" stroke="var(--muted)"/><line x1="${X(hi)}" y1="58" x2="${X(hi)}" y2="64" stroke="var(--muted)"/>
      <text x="${X(lo)}" y="73" text-anchor="middle" font-size="9.5" font-family="var(--f-data)" fill="var(--muted)">${lo}</text><text x="${X(hi)}" y="73" text-anchor="middle" font-size="9.5" font-family="var(--f-data)" fill="var(--muted)">${hi} ${unit}</text>
      <text x="14" y="9" font-size="9.5" font-family="var(--f-data)" fill="var(--muted)">score 1</text></svg>`;
  }

  const kd = D.datasets.find(d => d.id === 'D7').variants, k05 = kd.find(v => v.P === .5).K, k5 = kd.find(v => v.P === 5).K;
  const rad = D.datasets.find(d => d.id === 'D6').variants;
  const FACTORS = [
    { k: 'flame', t: 'Flame size and growth', m: 'How big the flame is and how fast it grows. A bigger flame touches more of the cabin and is harder to isolate.',
      f: 'size   = ramp(flame diameter, 10, 60 mm)\ngrowth = ramp(growth rate, 2, 30 mm/s)\nscore  = 0.6 x size + 0.4 x growth', r: [['mm', 10, 60]],
      mi: 'With no buoyancy the flame is a sphere that thickens outward on every side. It does not lift away from the fuel, so a flame of the same fuel can sit larger around it than on Earth.',
      d: `NASA flame diameters for a 4.5 mm n-dodecane droplet reach ${fmt(rad[1].DfMax, 0)} mm at 5 atm and ${fmt(rad[0].DfMax, 0)} mm at 0.5 atm. Growth is fastest in the first second after ignition, about 10 to 15 mm/s.` },
    { k: 'thermal', t: 'Temperature', m: 'Peak flame temperature, the cool-phase temperature, and the cabin air temperature.',
      f: 'score = 0.70 x ramp(peak T, 500, 2500 K)\n      + 0.15 x ramp(cool-phase T, 500, 1200 K)\n      + 0.15 x ramp(cabin air, 25, 60 C)', r: [['K', 500, 2500]],
      mi: 'Heat has nowhere to rise to, so it stays near the flame and warms nearby surfaces and air. A cool flame is far colder than a hot flame but is not harmless.',
      d: `Simulated peaks are ${fmt(D.cal.T.hot[0][1], 0)} K at 0.5 atm and ${fmt(D.cal.T.hot[1][1], 0)} K at 5 atm. After radiative extinction the cool flame holds about ${fmt(D.cal.T.cool[0][1], 0)} K at 0.5 atm and ${fmt(D.cal.T.cool[2][1], 0)} K at 5 atm. In 600 K gas a cool flame alone reaches about 1150 K.` },
    { k: 'energy', t: 'Heat release and radiation', m: 'How much energy the flame puts out, as total heat release and as radiated power that can ignite nearby material.',
      f: 'heat release = (pi/4) x rho x K x D x dHc\nscore = 0.5 x ramp(heat release, 5, 120 W)\n      + 0.5 x ramp(radiated power, 2, 50 W)', r: [['W', 5, 120], ['W', 2, 50]],
      mi: 'Microgravity flames are strongly radiating because soot stays in the flame zone. Radiation, not convection, carries much of the heat to surroundings.',
      d: `Peak radiance rises from ${fmt(rad[0].Qpk, 1)} W at 0.5 atm to ${fmt(rad[1].Qpk, 1)} W at 5 atm (+${fmt((rad[1].Qpk / rad[0].Qpk - 1) * 100, 0)} %). The three-stage n-dodecane experiment peaked at 62.8 W.` },
    { k: 'persist', t: 'Persistence and detectability', m: 'How long the flame lasts, how much fuel it consumes, and what share of the burn is a cool flame that cameras tend to miss.',
      f: 'score = 0.40 x ramp(burn time, 1, 50 s)\n      + 0.25 x ramp(fuel burned, 0.6, 1.0)\n      + 0.35 x (cool-flame share of burn time)', r: [['s', 1, 50]],
      mi: 'There is no rising smoke column to trigger a ceiling detector. Cool flames emit almost no visible light, so a droplet that looks extinguished can keep burning for most of its life.',
      d: 'In the three-stage test the hot flame lasts about 6 s of 38 s. The rest is a cool flame. At 3 atm and above the cool flame burns the droplet down to nothing (extinction diameter 0 mm).' },
    { k: 'atmos', t: 'Atmosphere', m: 'Oxygen partial pressure, humidity and airflow in the cabin.',
      f: 'oxygen = ramp(pressure x O2 fraction, 0.10, 0.70 atm)\ndry    = 1 - ramp(humidity, 15, 60 %)\nflow   = 0.5 if < 5 cm/s, 0.2 from 5 to 25, rising to 0.9 at 60 cm/s\nscore  = 0.5 x oxygen + 0.25 x dry + 0.25 x flow', r: [['atm', 0.1, 0.7]],
      mi: 'Oxygen supply sets how hot and fast the flame burns. Still air lets gas and soot collect; strong air flow feeds the flame and carries heat farther.',
      d: `The burning-rate constant K rises with pressure from ${fmt(k05, 2)} mm2/s at 0.5 atm to ${fmt(k5, 2)} mm2/s at 5 atm (+${fmt((k5 / k05 - 1) * 100, 0)} %, experiment means). The model uses K = ${D.cal.K.a} + ${D.cal.K.b} ln(P).` },
    { k: 'gas', t: 'Toxic gas and soot', m: 'Carbon monoxide the fuel load could produce, soot in the flame, and oxygen drawn down by burning.',
      f: 'CO (ppm) = (fuel burned x CO yield / 28.01) / (P V / R T) x 1,000,000\nscore = 0.25 x ramp(soot, 5, 100 ppm)\n      + 0.55 x ramp(CO, 3, 60 ppm)\n      + 0.20 x ramp(O2 drop, 0.1, 2 %)', r: [['ppm CO', 3, 60]],
      mi: 'A cabin is a closed volume with the crew in it. Cool flames burn incompletely, so each gram of fuel burned in a cool flame yields about five times more CO than in a hot flame in this model.',
      d: 'The NASA files do not measure CO or soot. These are estimated from how much fuel burns hot versus cool (from the extinction diameters), a stated yield, and the cabin size and fuel load you set.' },
    { k: 'context', t: 'Crew and equipment exposure', m: 'How close the flame is to people and to life-support, power or data equipment.',
      f: 'crew   = 1 - ramp(distance, 0.5, 10 m)\nassets = 0, 0.5 or 1 for none, nearby, adjacent\nscore  = 0.6 x crew + 0.4 x assets', r: [['m (inverted)', 0.5, 10]],
      mi: 'Escape paths are short and everything is within a few metres. Distance buys time, and isolating a module is easier when critical systems are not next to the fuel.',
      d: 'Not in the NASA files. This is your input and is the same for every demo condition, so it shifts all scores equally and never changes the ranking.' }
  ];

  function render() {
    const root = $('#view-method'), M = C.method;
    const phys = [
      ['Droplet burning (d-squared law)', 'D(t)^2 = D0^2 - K t', 'A burning droplet shrinks so that the square of its diameter falls linearly. K (mm2/s) is the burning-rate constant. Burn time is about D0^2 / K, which gives 38 to 55 s for a 4.5 mm droplet in the NASA files.'],
      ['Heat release', 'Q = (pi/4) x rho x K x D x dHc', 'Mass burning rate is (pi/4) rho K D. Multiply by the heat of combustion dHc to get watts. For 4.5 mm n-dodecane at K = 0.31 this is about 36 W, matching the 25 to 38 W of radiated power NASA measured once a radiated fraction of 0.8 is applied.'],
      ['Three stages of burning', 'hot flame  ->  radiative extinction  ->  cool flame', 'Large droplets (above about 3.5 mm) burn hot, lose too much heat to radiation and go out at a diameter Dext_hot, then continue as a cool flame until Dext_cool. Dext_hot is fitted from the alkane experiments as a x D0 + b for each fuel.'],
      ['Cool-flame persistence', 'Dext_cool(P) = Dext_cool(1 atm) x shape(P)', 'The shape of the pressure curve comes from the NASA experiments: 1.84 mm at 0.5 atm, 0.86 at 0.75, 0.42 at 1, 0.41 at 1.25 and 0 at 3 atm. A smaller extinction diameter means the cool flame lasts longer.'],
      ['Cabin gas', 'n = P V / (R T)', 'Fuel burned in the hot and cool stages is split by volume, (1 - (Dhot/D0)^3) and (Dhot^3 - Dcool^3) / D0^3. Each share gets its own CO yield. The moles of CO are divided by the moles of air in the cabin.']
    ];
    root.innerHTML = `
      <div class="lab-head"><h1 style="font-size:clamp(1.9rem,4vw,2.8rem)">${esc(M.heading)}</h1><p>${esc(M.lead)}</p></div>
      <nav class="toc" aria-label="On this page"><a href="#method" data-jump="m-score">The score</a><a href="#method" data-jump="m-factors">Seven factors</a><a href="#method" data-jump="m-tree">Decision tree rules</a><a href="#method" data-jump="m-phys">Physics</a><a href="#method" data-jump="m-try">Try it</a><a href="#method" data-jump="m-assume">Assumptions</a></nav>

      <section id="m-score" class="band" style="padding-top:8px"><div class="sec-head"><h2>The score</h2></div>
        <div class="grid g2">
          <div class="grid" style="gap:12px"><p>Every input is turned into a number between 0 and 1 by a straight-line ramp between a "safe" value and a "dangerous" value. The seven factor scores are weighted and added.</p>
            <div class="eq">ramp(x, lo, hi) = clamp( (x - lo) / (hi - lo), 0, 1 )\n\nRisk score = 100 x ( ${Object.keys(W).map(k => 'w_' + k + ' x s_' + k).join('\n               + ')} )</div></div>
          <div class="scroll"><table class="t"><thead><tr><th>Factor</th><th>Weight</th></tr></thead><tbody>${FACTORS.map(f => `<tr><td>${esc(f.t)}</td><td class="mono">${fmt(W[f.k] * 100, 0)} %</td></tr>`).join('')}</tbody></table>
          <table class="t" style="margin-top:14px"><thead><tr><th>Score</th><th>Level</th></tr></thead><tbody><tr><td class="mono">below ${CFG.levels.low}</td><td><span class="pill lv0">Low</span></td></tr><tr><td class="mono">${CFG.levels.low} to ${CFG.levels.moderate}</td><td><span class="pill lv1">Moderate</span></td></tr><tr><td class="mono">${CFG.levels.moderate} to ${CFG.levels.high}</td><td><span class="pill lv2">High</span></td></tr><tr><td class="mono">${CFG.levels.high} and above</td><td><span class="pill lv3">Critical</span></td></tr></tbody></table></div>
        </div></section>

      <section id="m-factors" class="band"><div class="sec-head"><h2>Seven factors and how each one affects a microgravity flame</h2></div>
        ${FACTORS.map(f => `<div class="factor"><div><div class="w">weight ${fmt(W[f.k] * 100, 0)} %</div><h3>${esc(f.t)}</h3><p>${esc(f.m)}</p><div class="eq">${esc(f.f)}</div>${f.r.map(r => ramp(r[1], r[2], r[0])).join('')}</div>
          <div><h4>Why it matters in microgravity</h4><p style="margin-top:6px">${esc(f.mi)}</p><h4 style="margin-top:16px">What the NASA data shows</h4><p style="margin-top:6px">${esc(f.d)}</p></div></div>`).join('')}</section>

      <section id="m-tree" class="band"><div class="sec-head"><h2>How the decision tree uses the score</h2><p>The six steps follow the reference safety decision tree. The numbers are all in the settings file.</p></div>
        <div class="scroll"><table class="t"><thead><tr><th>Step</th><th>What it does</th><th>Rule</th></tr></thead><tbody>
        <tr><td>1. Collect</td><td>Checks six sensor channels.</td><td>Visual needs a luminous hot flame. UV needs peak T above 1000 K. IR needs 300 K above the cabin. Schlieren needs a flame zone over 3 mm. Soot needs 5 ppm. Gas needs CO above 3 ppm.</td></tr>
        <tr><td>2. Analyze</td><td>Estimates K, flame size, temperature, heat release, gas.</td><td>Uses NASA values where the file has them and the calibrated model where it does not.</td></tr>
        <tr><td>3. Detect</td><td>Fire or unsafe condition?</td><td>Yes if any of: peak T above ${TR.flameTempK} K; hot spot above ${TR.ambientTempC} C; CO above ${TR.coPpm} ppm; soot above ${TR.sootPpm} ppm; flame over ${TR.flameMm} mm; growth over ${TR.flameGrowthMmS} mm/s. Low humidity (under ${TR.humidityPct} %) adds to risk but does not trigger alone. If No, the tree loops back to monitoring.</td></tr>
        <tr><td>4. Evaluate</td><td>Scores the seven factors.</td><td>Formulas above.</td></tr>
        <tr><td>5. Risk level</td><td>Maps the score to a level.</td><td>Bands above. Hard rules can only raise the level: CO at or above ${CFG.overrides.coHighPpm} ppm; a hot flame within ${CFG.overrides.crewCloseM} m of crew; a hot flame with oxygen at or above ${CFG.overrides.o2HighPct} %. Each forces at least High.</td></tr>
        <tr><td>6. Respond</td><td>Picks the response branch.</td><td>Low: 6A automated and local. Moderate: 6B escalate and respond. High or Critical: 6C immediate and maximum response. Then reassess until controlled, and log.</td></tr></tbody></table></div></section>

      <section id="m-phys" class="band"><div class="sec-head"><h2>The physics behind the numbers</h2></div>
        <div class="grid g2">${phys.map(p => `<div class="panel"><h4>${esc(p[0])}</h4><div class="eq" style="margin:10px 0">${esc(p[1])}</div><p style="font-size:.93rem;color:var(--muted)">${esc(p[2])}</p></div>`).join('')}</div></section>

      <section id="m-try" class="band"><div class="sec-head"><h2>Try it</h2><p>Move a slider and watch each factor change. This runs n-dodecane through the same engine as the lab.</p></div>
        <div class="panel sandbox"><div id="sbControls"></div><div id="sbOut"></div></div></section>

      <section id="m-assume" class="band"><div class="sec-head"><h2>Assumptions and limits</h2><p>These constants are not measured in the NASA files. They are set in js/config.js and can be changed.</p></div>
        <div class="scroll"><table class="t"><thead><tr><th>Assumption</th><th>Value</th><th>Basis</th></tr></thead><tbody>
        ${[['Radiated fraction, hot flame', CFG.assumptions.hotRadiatedFraction, 'Fit so modelled radiance matches the 25 to 38 W NASA measured.'], ['Radiated fraction, cool flame', CFG.assumptions.coolRadiatedFraction, 'Fit to the radiance tail of the three-stage and 2024 files.'], ['Hot-stage K relative to cool K', CFG.assumptions.hotKFactor, 'Hot-stage slope in the three-stage simulation.'], ['K of small droplets that burn hot to the end', CFG.assumptions.fullBurnKFactor, 'Assumption. Override by entering K.'], ['Flame diameter / droplet diameter at 1 atm', CFG.assumptions.flameRatioHot, 'Between 6.3 (three-stage) and 8.7 (2024 burning history).'], ['CO yield, hot flame (kg/kg)', CFG.assumptions.coYieldHot, 'Typical value for sooty alkane flames. Assumption.'], ['CO yield, cool flame (kg/kg)', CFG.assumptions.coYieldCool, 'Cool flames oxidise partly, so more CO. Assumption.'], ['Flame soot at 1 atm (ppm)', CFG.assumptions.sootRefPpm, 'Order of magnitude for droplet flames. Assumption.'], ['Smallest droplet with radiative extinction (mm)', CFG.assumptions.smallDropletMm, 'Between the 3 mm and 4 mm cases in the alkane simulations.']].map(r => `<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
        <p class="note" style="margin-top:20px">The NASA data covers single droplets of alkane fuels in controlled chambers between 0.5 and 5 atm. Results for other fuels, solids, large fires, cabin geometry or lunar and other partial gravity are extrapolations or not modelled. The 0 to 100 score is a ranking tool for comparing conditions, not a probability of harm.</p></section>`;

    $$('[data-jump]', root).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); }));
    sandbox();
  }

  function sandbox() {
    const S = { P: 1, O2: 21, D0: 4.5, crew: 4, fuel: 15, hum: 45 };
    const defs = [['P', 'Pressure (atm)', 0.5, 5, 0.25], ['O2', 'Oxygen (%)', 19, 35, 0.5], ['D0', 'Droplet size (mm)', 1, 6, 0.1], ['hum', 'Humidity (%)', 10, 70, 1], ['crew', 'Crew distance (m)', 0.5, 10, 0.5], ['fuel', 'Fuel on hand (g)', 0, 200, 5]];
    $('#sbControls').innerHTML = defs.map(([k, l, mn, mx, st]) => `<div class="field"><label for="sb_${k}">${l}<small class="mono" id="sbv_${k}">${S[k]}</small></label><input id="sb_${k}" type="range" min="${mn}" max="${mx}" step="${st}" value="${S[k]}"></div>`).join('');
    const out = () => {
      const ctx = { O2: S.O2, humidity: S.hum, crewDistM: S.crew, fuelLoadG: S.fuel };
      const F = E.completeFeatures({ fuel: 'C12', P: S.P, D0: S.D0, mode: 'hot+cool' }, ctx), r = E.assess(F, ctx);
      $('#sbOut').innerHTML = `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px"><span class="pill lv${r.level}">${E.LEVELS[r.level]}</span><b class="mono" style="font-size:1.4rem">${fmt(r.composite, 1)} / 100</b><span class="muted" style="font-size:.88rem">${F.mode === 'hot' ? 'Small droplet: burns hot to the end.' : 'Hot flame, radiative extinction, then cool flame.'} Peak ${fmt(F.Tpk, 0)} K, radiated ${fmt(F.Qpk, 0)} W, CO ${fmt(r.gas.coPpm, 0)} ppm.</span></div>
        <div class="grid" style="gap:8px">${Object.values(r.sub).map(o => `<div class="drv"><span>${esc(o.label)}</span><span class="bar"><i class="fill${o.s >= .75 ? 3 : o.s >= .5 ? 2 : o.s >= .25 ? 1 : 0}" style="width:${o.s * 100}%"></i></span><span class="num">${fmt(o.s * 100, 0)}</span></div>`).join('')}</div>
        <p class="muted" style="font-size:.84rem;margin-top:12px">Bars show each factor score from 0 to 100 before weighting.${r.overrides.length ? ' Hard rule: ' + esc(r.overrides.join(' ')) : ''}</p>`;
    };
    defs.forEach(([k]) => { const el = $('#sb_' + k); el.oninput = () => { S[k] = +el.value; $('#sbv_' + k).textContent = S[k]; out(); }; });
    out();
  }
  g.MGFMethod = { render };
})(window);
