/* ============================================================
   FIRE INSIGHT ENGINE
   1. simulate()          droplet-burning model calibrated to the NASA files
   2. completeFeatures()  fills any gap in a data set with the model
   3. assess()            walks the six-step safety decision tree and scores risk
   ============================================================ */
(function (g) {
  const CFG = g.MGF_CONFIG, CAL = g.MGF_DATA.cal, A = CFG.assumptions;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const ramp = (x, lo, hi) => clamp((x - lo) / (hi - lo), 0, 1);
  const fmt = (x, d = 1) => (x === null || x === undefined || isNaN(x)) ? 'n/a' : Number(x).toFixed(d);

  /* ---------- calibration curves taken from the NASA files ---------- */
  function interpLn(points, P) {                       // piecewise-linear in ln(P), clamped at the ends
    const lp = Math.log(P);
    if (P <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      if (P <= points[i][0]) {
        const a = points[i - 1], b = points[i];
        return a[1] + (b[1] - a[1]) * (lp - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0]));
      }
    }
    return points[points.length - 1][1];
  }
  const Kcool = P => Math.max(0.15, CAL.K.a + CAL.K.b * Math.log(P));
  const TpkHot = P => { const h = CAL.T.hot, s = (h[1][1] - h[0][1]) / Math.log(h[1][0] / h[0][0]); return clamp(h[0][1] + s * Math.log(P / h[0][0]), 2200, 3000); };
  const Tcool = P => interpLn(CAL.T.cool, P);
  const hotShape = P => interpLn(CAL.dext.P.map((p, i) => [p, CAL.dext.hotModel[i]]), P) / interpLn(CAL.dext.P.map((p, i) => [p, CAL.dext.hotModel[i]]), 1);
  const COOL_PTS = [[0.5, 1.839], [0.75, 0.861], [1, 0.417], [1.25, 0.406], [3, 0]];
  const coolShape = P => (P >= 3 ? 0 : interpLn(COOL_PTS, P)) / 0.417;

  function dextFor(fuel, P, D0) {
    const f = CAL.fuels[fuel] || CAL.fuels.C12;
    let hot = (f.a * D0 + f.b) * hotShape(P);
    hot = clamp(hot, 0, D0 - 0.05);
    let cool = f.cf1 * coolShape(P);
    cool = clamp(cool, 0, 0.8 * hot);
    return { hot, cool };
  }
  const fuelProps = k => CFG.fuels[k] || CFG.fuels.OTHER;
  const hrr = (K, D_mm, fuel) => { const f = fuelProps(fuel); return Math.PI / 4 * f.rho * (K * 1e-6) * (D_mm * 1e-3) * f.dHc; };

  /* ---------- 1. droplet-burning simulation ---------- */
  function simulate(p) {
    const fuel = p.fuel || 'C12', P = p.P || 1, O2 = p.O2 ?? 21;
    const o2k = 1 + A.o2KPerPct * (O2 - 21);
    const Kc = (p.K && p.K > 0 ? p.K : Kcool(P) * o2k);
    let regime = p.regime || 'auto', D0 = p.D0 || 4.4, mode;
    if (regime === 'cool' || regime === 'osc') { mode = regime; D0 = p.D0 || 0.5; }
    else mode = D0 < A.smallDropletMm ? 'hot' : 'hot+cool';
    const Tp = (mode === 'hot' || mode === 'hot+cool') ? TpkHot(P) + A.o2TPerPct * (O2 - 21) : A.coolOnlyTempK;
    const Tc = (mode === 'hot' || mode === 'hot+cool') ? Tcool(P) : A.coolOnlyTempK;
    let Kh = Kc * A.hotKFactor, DHF = 0, DCF = 0, kCoolOnly = Kc;
    if (mode === 'cool' || mode === 'osc') { kCoolOnly = (p.K && p.K > 0) ? p.K : (mode === 'cool' ? 0.31 : 0.243); }
    if (mode === 'hot') { Kh = Kc * A.fullBurnKFactor; }
    if (mode === 'hot+cool') {
      const d = dextFor(fuel, P, D0);
      DHF = p.DextHot != null ? clamp(p.DextHot, 0, D0 - 0.02) : d.hot;
      DCF = p.DextCool != null ? clamp(p.DextCool, 0, Math.max(0, DHF - 0.01)) : d.cool;
    }
    // stage times from the d-squared law
    let t1, t2, tEnd;
    if (mode === 'hot') { t1 = D0 * D0 / Kh; t2 = 0; }
    else if (mode === 'hot+cool') { t1 = (D0 * D0 - DHF * DHF) / Kh; t2 = (DHF * DHF - DCF * DCF) / Kc; }
    else { t1 = 0; t2 = D0 * D0 / kCoolOnly; }
    tEnd = t1 + t2;
    const N = 240, out = { t: [], D: [], Df: [], T: [], Q: [], H: [] };
    const Rh = A.flameRatioHot * Math.pow(P, A.flameRatioPressureExp);
    for (let i = 0; i <= N; i++) {
      const t = tEnd * i / N; let D, T, Df, Q, H;
      if (t <= t1 && mode !== 'cool' && mode !== 'osc') {
        const K = Kh; D = Math.sqrt(Math.max(0, D0 * D0 - K * t));
        const tau = 0.35 * t1; const hotBase = mode === 'hot' ? Tp * 0.8 : Tc;
        T = hotBase + (Tp - hotBase) * Math.exp(-t / Math.max(tau, 0.2));
        if (mode === 'hot+cool' && t > t1 - 0.4) T = T;       // handled at stage switch
        Df = Rh * D * (1 - 0.8 * Math.exp(-t / 0.9));
        H = hrr(K, D, fuel); Q = A.hotRadiatedFraction * H;
      } else {
        const t0 = t1, K = (mode === 'cool' || mode === 'osc') ? kCoolOnly : Kc;
        const D1sq = (mode === 'cool' || mode === 'osc') ? D0 * D0 : DHF * DHF;
        D = Math.sqrt(Math.max(0, D1sq - K * (t - t0)));
        T = Tc;
        Df = (mode === 'cool' || mode === 'osc') ? 9 * D : A.coolFlameRatio * D;
        H = hrr(K, D, fuel); Q = A.coolRadiatedFraction * H;
        if (mode === 'osc') { const s = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 0.12); Q *= s; Df *= (0.7 + 0.3 * s); }
      }
      out.t.push(t); out.D.push(D); out.Df.push(Df); out.T.push(T); out.Q.push(Q); out.H.push(H);
    }
    return Object.assign(out, { mode, D0, K: D0 * D0 / tEnd, Kh, Kc, DextHot: DHF, DextCool: DCF, t1, t2, tEnd, fuel, P, O2 });
  }

  function growthOf(t, y, win) {
    let best = 0;
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
      if (t[j] - t[i] >= win) { best = Math.max(best, (y[j] - y[i]) / (t[j] - t[i])); break; }
    }
    return best;
  }

  /* ---------- 2. fill the gaps in a data set ---------- */
  function completeFeatures(raw, ctx) {
    ctx = Object.assign({}, CFG.defaultContext, ctx || {});
    const regime = raw.mode === 'cool' ? 'cool' : raw.mode === 'osc' ? 'osc' : 'auto';
    const sim = simulate({ fuel: raw.fuel || 'C12', P: raw.P, O2: ctx.O2, D0: raw.D0 || (regime === 'auto' ? 4.4 : 0.5), K: raw.K, regime, DextHot: raw.DextHot, DextCool: raw.DextCool });
    const win = sim.mode === 'cool' || sim.mode === 'osc' ? 0.05 : 1.0;
    const fromSim = {
      D0: sim.D0, K: sim.K, Tpk: Math.max(...sim.T), Tcool: sim.mode === 'hot+cool' ? Tcool(raw.P) : sim.T[sim.T.length - 1],
      DfMax: Math.max(...sim.Df), growth: growthOf(sim.t, sim.Df, win), Qpk: Math.max(...sim.Q),
      DextHot: sim.DextHot, DextCool: sim.DextCool, tBurn: sim.tEnd
    };
    const F = { fuel: raw.fuel || 'C12', P: raw.P, O2: ctx.O2, mode: sim.mode, src: Object.assign({}, raw.src || {}), sim };
    for (const k of Object.keys(fromSim)) {
      if (raw[k] !== null && raw[k] !== undefined) { F[k] = raw[k]; if (!F.src[k]) F.src[k] = 'data'; }
      else { F[k] = fromSim[k]; F.src[k] = 'model'; }
    }
    if (raw.soot != null) { F.sootPpm = raw.soot; F.src.sootPpm = 'data'; }
    else {
      const hotShare = sim.mode === 'cool' || sim.mode === 'osc' ? 0 : 1;
      const Hh = Math.max(...sim.H.slice(0, Math.max(2, Math.floor(sim.H.length * 0.3))));
      F.sootPpm = hotShare ? A.sootRefPpm * Math.sqrt(F.P) * (Hh / 36) * Math.pow(F.O2 / 21, 2) : 1.0;
      F.src.sootPpm = 'model';
    }
    F.HRRpk = Math.max(...sim.H);
    F.src.HRRpk = 'model';
    return F;
  }

  /* ---------- 3. decision tree + scoring ---------- */
  const LEVELS = ['Low', 'Moderate', 'High', 'Critical'];
  function levelFor(score) { const L = CFG.levels; return score >= L.high ? 3 : score >= L.moderate ? 2 : score >= L.low ? 1 : 0; }

  function assess(F, ctxIn) {
    const ctx = Object.assign({}, CFG.defaultContext, ctxIn || {});
    const W = CFG.weights, TR = CFG.triggers, OV = CFG.overrides;
    const hotFlame = F.mode === 'hot' || F.mode === 'hot+cool';
    const coolOnly = F.mode === 'cool' || F.mode === 'osc';
    const Tamb = ctx.ambientC + 273.15;

    /* gas picture: scale the flame behaviour to the fuel that could burn in the cabin */
    const D0 = F.D0, DHF = hotFlame ? (F.mode === 'hot' ? 0 : F.DextHot) : 0;
    const DCF = F.DextCool || 0;
    let mHot = 0, mCool = 0, resid = 0;
    if (F.mode === 'hot') { mHot = 1; }
    else if (F.mode === 'hot+cool') { mHot = 1 - Math.pow(DHF / D0, 3); mCool = (Math.pow(DHF, 3) - Math.pow(DCF, 3)) / Math.pow(D0, 3); resid = Math.pow(DCF / D0, 3); }
    else { mCool = 1 - Math.pow(DCF / D0, 3); resid = Math.pow(DCF / D0, 3); }
    const burned = mHot + mCool;
    const nAir = F.P * 101325 * ctx.volumeM3 / (8.314 * Tamb);
    const coG = ctx.fuelLoadG * (mHot * A.coYieldHot + mCool * A.coYieldCool);
    const coPpm = (coG / 28.01) / nAir * 1e6;
    const o2dPct = (ctx.fuelLoadG * burned * 3.5 / 32) / nAir * 100;       // ~3.5 g O2 per g of alkane
    const tHot = F.mode === 'hot' ? F.tBurn : (F.mode === 'hot+cool' ? F.sim.t1 : 0);
    const coolShare = F.tBurn > 0 ? clamp(1 - tHot / F.tBurn, 0, 1) : 0;

    /* ---- Step 1: multi-modal data ---- */
    const dT = F.Tpk - Tamb;
    const sensors = [
      { id: 'visual', name: 'Visual (400-700 nm)', on: hotFlame && F.Tpk > 1300, detail: hotFlame ? 'Hot flame is luminous; camera sees it.' : 'Cool flame gives almost no visible light; cameras can miss it.' },
      { id: 'uv', name: 'UV (250-400 nm)', on: F.Tpk > 1000, detail: F.Tpk > 1000 ? 'OH* emission from the flame front is present.' : 'OH* emission too weak to trigger.' },
      { id: 'ir', name: 'IR (1-5 um and 8-14 um)', on: dT > 300, detail: dT > 300 ? 'Thermal radiation clearly above cabin background (+' + fmt(dT, 0) + ' K).' : 'Weak thermal signature.' },
      { id: 'backlit', name: 'Backlit / Schlieren', on: F.DfMax > 3, detail: F.DfMax > 3 ? 'Density gradients show a flame zone about ' + fmt(F.DfMax, 0) + ' mm wide, even for a cool flame.' : 'Zone too small to resolve.' },
      { id: 'soot', name: 'Soot detection', on: F.sootPpm >= 5, detail: 'Estimated soot volume fraction ' + fmt(F.sootPpm, 1) + ' ppm.' },
      { id: 'env', name: 'Environmental sensors', on: coPpm > 3 || ctx.ambientC > 40, detail: 'CO about ' + fmt(coPpm, 0) + ' ppm, O2 ' + fmt(F.O2, 1) + ' %, cabin ' + fmt(ctx.ambientC, 0) + ' C, humidity ' + fmt(ctx.humidity, 0) + ' %.' }
    ];
    const channelsOn = sensors.filter(s => s.on).length;

    /* ---- Step 3: fire or unsafe condition ---- */
    const triggers = [
      { id: 'flame', label: 'Flame present (peak ' + fmt(F.Tpk, 0) + ' K)', hit: F.Tpk > TR.flameTempK },
      { id: 'temp', label: 'Hot spot above ' + TR.ambientTempC + ' C', value: fmt(F.Tpk - 273.15, 0) + ' C at the flame, cabin ' + fmt(ctx.ambientC, 0) + ' C', hit: (F.Tpk - 273.15) > TR.ambientTempC && F.Tpk > TR.flameTempK },
      { id: 'co', label: 'CO above ' + TR.coPpm + ' ppm', value: fmt(coPpm, 0) + ' ppm', hit: coPpm > TR.coPpm },
      { id: 'soot', label: 'Soot above ' + TR.sootPpm + ' ppm (0.01 %)', value: fmt(F.sootPpm, 1) + ' ppm', hit: F.sootPpm > TR.sootPpm },
      { id: 'size', label: 'Flame larger than expected (' + TR.flameMm + ' mm)', value: fmt(F.DfMax, 0) + ' mm', hit: F.DfMax > TR.flameMm },
      { id: 'growth', label: 'Growth faster than ' + TR.flameGrowthMmS + ' mm/s', value: fmt(F.growth, 1) + ' mm/s', hit: F.growth > TR.flameGrowthMmS }
    ];
    const fireDetected = triggers.some(t => t.hit);
    const lowHum = ctx.humidity < TR.humidityPct;

    /* ---- Step 4: evaluate characteristics (each 0-1) ---- */
    const sFlameSize = ramp(F.DfMax, 10, 60), sGrow = ramp(F.growth, 2, 30);
    const flame = 0.6 * sFlameSize + 0.4 * sGrow;
    const sTpk = ramp(F.Tpk, 500, 2500), sTc = ramp(F.Tcool, 500, 1200), sAmb = ramp(ctx.ambientC, 25, 60);
    const thermal = 0.70 * sTpk + 0.15 * sTc + 0.15 * sAmb;
    const sHRR = ramp(F.HRRpk, 5, 120), sQ = ramp(F.Qpk, 2, 50);
    const energy = 0.5 * sHRR + 0.5 * sQ;
    const sDur = ramp(F.tBurn, 1, 50), sBurned = ramp(burned, 0.6, 1.0);
    const sDetect = clamp(coolShare + (1 - coolShare) * 0.15, 0, 1);
    const persist = 0.40 * sDur + 0.25 * sBurned + 0.35 * sDetect;
    const pO2 = F.P * F.O2 / 100;
    const sPO2 = ramp(pO2, 0.10, 0.70), sHum = 1 - ramp(ctx.humidity, 15, 60);
    const v = ctx.ventCmS; const sVent = v < 5 ? 0.5 : v <= 25 ? 0.2 : 0.2 + 0.7 * ramp(v, 25, 60);
    const atmos = 0.5 * sPO2 + 0.25 * sHum + 0.25 * sVent;
    const sSoot = ramp(F.sootPpm, 5, 100), sCO = ramp(coPpm, 3, 60), sO2d = ramp(o2dPct, 0.1, 2.0);
    const gas = 0.25 * sSoot + 0.55 * sCO + 0.20 * sO2d;
    const sCrew = 1 - ramp(ctx.crewDistM, 0.5, 10), sAsset = ctx.assets === 'adjacent' ? 1 : ctx.assets === 'nearby' ? 0.5 : 0;
    const context = 0.6 * sCrew + 0.4 * sAsset;

    const sub = {
      flame:   { s: flame,   label: 'Flame size and growth', parts: [['Peak flame diameter ' + fmt(F.DfMax, 1) + ' mm', sFlameSize], ['Growth ' + fmt(F.growth, 1) + ' mm/s', sGrow]] },
      thermal: { s: thermal, label: 'Temperature', parts: [['Peak flame temperature ' + fmt(F.Tpk, 0) + ' K', sTpk], ['Cool-phase temperature ' + fmt(F.Tcool, 0) + ' K', sTc], ['Cabin air ' + fmt(ctx.ambientC, 0) + ' C', sAmb]] },
      energy:  { s: energy,  label: 'Heat release and radiation', parts: [['Heat release ' + fmt(F.HRRpk, 0) + ' W', sHRR], ['Radiated power ' + fmt(F.Qpk, 0) + ' W', sQ]] },
      persist: { s: persist, label: 'Persistence and detectability', parts: [['Burn time ' + fmt(F.tBurn, 1) + ' s', sDur], ['Fuel consumed ' + fmt(burned * 100, 0) + ' %', sBurned], ['Cool-flame share ' + fmt(coolShare * 100, 0) + ' % of burn (hard to see)', sDetect]] },
      atmos:   { s: atmos,   label: 'Atmosphere', parts: [['Oxygen partial pressure ' + fmt(pO2, 2) + ' atm', sPO2], ['Humidity ' + fmt(ctx.humidity, 0) + ' %', sHum], ['Airflow ' + fmt(v, 0) + ' cm/s', sVent]] },
      gas:     { s: gas,     label: 'Toxic gas and soot', parts: [['CO about ' + fmt(coPpm, 0) + ' ppm', sCO], ['Soot ' + fmt(F.sootPpm, 1) + ' ppm', sSoot], ['O2 drop ' + fmt(o2dPct, 2) + ' %', sO2d]] },
      context: { s: context, label: 'Crew and equipment exposure', parts: [['Crew ' + fmt(ctx.crewDistM, 1) + ' m away', sCrew], ['Critical equipment: ' + ctx.assets, sAsset]] }
    };
    let composite = 0;
    for (const k of Object.keys(sub)) { sub[k].w = W[k]; sub[k].contrib = 100 * W[k] * sub[k].s; composite += sub[k].contrib; }

    /* ---- Step 5: risk level ---- */
    let lvl = levelFor(composite); const overrides = [];
    const raise = (min, why) => { if (lvl < min) { lvl = min; } overrides.push(why); };
    if (coPpm >= OV.coHighPpm) raise(2, 'CO about ' + fmt(coPpm, 0) + ' ppm is at or above the ' + OV.coHighPpm + ' ppm hard limit.');
    if (hotFlame && ctx.crewDistM <= OV.crewCloseM) raise(2, 'A hot flame is within ' + fmt(ctx.crewDistM, 1) + ' m of crew.');
    if (hotFlame && F.O2 >= OV.o2HighPct) raise(2, 'Oxygen at ' + fmt(F.O2, 0) + ' % makes a hot flame far harder to put out.');
    if (!fireDetected) lvl = 0;
    const drivers = Object.entries(sub).map(([k, o]) => ({ key: k, label: o.label, contrib: o.contrib, s: o.s, w: o.w })).sort((a, b) => b.contrib - a.contrib);

    const res = {
      F, ctx, sensors, channelsOn, triggers, fireDetected, lowHum, sub, composite, level: lvl, levelName: LEVELS[lvl], overrides, drivers,
      gas: { coPpm, coG, o2dPct, mHot, mCool, resid, burned, nAir }, coolShare, hotFlame, coolOnly
    };
    res.branch = lvl <= 0 ? 'low' : lvl === 1 ? 'moderate' : 'high';
    res.report = buildReport(res);
    res.steps = buildSteps(res);
    return res;
  }

  /* ---------- reasoning text for each tree step ---------- */
  function buildSteps(r) {
    const { F, ctx, sub } = r;
    const top = r.drivers.slice(0, 3);
    const st = [];
    st.push({ id: 'start', title: 'Start: continuous monitoring', short: 'Monitoring cabin sensors.', lines: ['Cameras, spectral sensors and gas sensors are streaming. Nothing is assumed about the source of an alarm.'] });
    st.push({ id: 's1', title: '1. Collect multi-modal data', short: r.channelsOn + ' of 6 sensor channels see this event.',
      lines: r.sensors.map(s => (s.on ? 'Sees it: ' : 'Quiet: ') + s.name + '. ' + s.detail) });
    st.push({ id: 's2', title: '2. Analyze and interpret data', short: 'Estimated flame ' + fmt(F.DfMax, 0) + ' mm, peak ' + fmt(F.Tpk, 0) + ' K, burn rate K ' + fmt(F.K, 2) + ' mm2/s.',
      lines: ['Burn rate constant K = ' + fmt(F.K, 2) + ' mm2/s (d-squared law, droplet ' + fmt(F.D0, 2) + ' mm burns for about ' + fmt(F.tBurn, 1) + ' s).',
        'Flame regime: ' + ({ 'hot+cool': 'hot flame, radiative extinction, then a cool flame to the end', hot: 'hot flame to the end of the fuel', cool: 'steady cool flame', osc: 'oscillating cool flame' })[F.mode] + '.',
        'Heat release peaks near ' + fmt(F.HRRpk, 0) + ' W; radiated power peaks near ' + fmt(F.Qpk, 0) + ' W.',
        'Scaled to ' + fmt(ctx.fuelLoadG, 0) + ' g of fuel in ' + fmt(ctx.volumeM3, 0) + ' m3 of air, CO could reach about ' + fmt(r.gas.coPpm, 0) + ' ppm.'] });
    const hits = r.triggers.filter(t => t.hit);
    st.push({ id: 's3', title: '3. Is a fire or unsafe condition detected?', short: r.fireDetected ? 'YES. ' + hits.length + ' of 6 triggers fired.' : 'NO. No trigger fired; keep monitoring.', answer: r.fireDetected ? 'yes' : 'no',
      lines: r.triggers.map(t => (t.hit ? 'Triggered: ' : 'Clear: ') + t.label + (t.value ? ' (' + t.value + ')' : '')).concat(r.lowHum ? ['Risk factor: humidity ' + fmt(ctx.humidity, 0) + ' % is below ' + CFG.triggers.humidityPct + ' %.'] : []) });
    st.push({ id: 's4', title: '4. Evaluate fire characteristics and context', short: 'Biggest contributors: ' + top.map(d => d.label.toLowerCase()).join(', ') + '.',
      lines: Object.values(sub).map(o => o.label + ': ' + fmt(o.s * 100, 0) + ' / 100 (weight ' + fmt(o.w * 100, 0) + ' %, adds ' + fmt(o.contrib, 1) + ' points).') });
    st.push({ id: 's5', title: '5. What is the risk level?', short: r.levelName + ' risk, score ' + fmt(r.composite, 0) + ' / 100.', answer: r.branch,
      lines: ['Weighted score = ' + fmt(r.composite, 1) + ' / 100. Bands: Low below ' + CFG.levels.low + ', Moderate below ' + CFG.levels.moderate + ', High below ' + CFG.levels.high + ', Critical above.']
        .concat(r.overrides.length ? ['Hard rule applied: ' + r.overrides.join(' ')] : ['No hard rule changed the band.']) });
    const act = r.level <= 1 ? (r.level === 0 ? '6A Mitigate (automated, local)' : '6B Escalate and respond') : '6C Immediate and maximum response';
    st.push({ id: 's6', title: '6. Respond: ' + act, short: act + '.', lines: r.report.immediate.slice(0, 6) });
    st.push({ id: 'end', title: 'Fire controlled or extinguished', short: 'Log the incident, analyze the data, improve the system.', lines: ['Log the incident with all sensor traces.', 'Analyze the data against this model and update thresholds.', 'Improve the system: retrain detection, revise procedures, replace consumed suppressant.'] });
    return st;
  }

  /* ---------- the written risk report ---------- */
  function buildReport(r) {
    const { F, ctx } = r, R = g.MGF_CONTENT.report;
    const immediate = (r.level === 0 ? R.low : r.level === 1 ? R.moderate : R.high).slice();
    const precautions = R.precautionsBase.slice();
    const prevent = R.preventBase.slice();
    const insights = [];
    if (r.coolShare > 0.4 || r.coolOnly) {
      insights.push('Most of this burn is a cool flame (' + fmt(r.coolShare * 100, 0) + ' % of burn time). Cool flames give off almost no visible light, so a camera-only or smoke-only detector can miss them while CO and aldehydes build up.');
      precautions.push('Rely on IR, UV and Schlieren channels as well as cameras. Do not wait for visible flame before acting.');
      prevent.push('Add IR and CO redundancy in areas where volatile fuels are handled. Cool flames persist at low pressure and in warm gas.');
    }
    if (F.P >= 3) insights.push('At ' + fmt(F.P, 1) + ' atm the cool flame in the NASA tests burned until the droplet was gone (extinction diameter near 0 mm), and the burning-rate constant is about ' + fmt((Kcool(F.P) / Kcool(0.5) - 1) * 100, 0) + ' % higher than at 0.5 atm.');
    if (F.P <= 0.75) insights.push('At low pressure (' + fmt(F.P, 2) + ' atm) cool flames in the NASA tests went out at a much larger droplet size (up to about 1.9 mm), so fuel is left behind as vapour and burns less completely.');
    if (F.O2 > 23) { precautions.push('Oxygen is ' + fmt(F.O2, 0) + ' %. Keep ignition sources and fuels away from the enriched zone and limit the time spent there.'); prevent.push('Cap oxygen fraction in storage and work areas to the minimum the mission needs.'); }
    if (r.lowHum) { precautions.push('Humidity is ' + fmt(ctx.humidity, 0) + ' %. Raise it above 40 % if the cabin allows; dry air makes ignition easier.'); }
    if (r.gas.coPpm > CFG.triggers.coPpm) { insights.push('Scaled to your fuel load, CO could reach about ' + fmt(r.gas.coPpm, 0) + ' ppm in ' + fmt(ctx.volumeM3, 0) + ' m3, above the ' + CFG.triggers.coPpm + ' ppm alarm level.'); precautions.push('Crew should have breathing protection within reach before work with this fuel starts.'); }
    if (ctx.crewDistM <= 2) precautions.push('Crew are only ' + fmt(ctx.crewDistM, 1) + ' m from the flame. Move work or equipment so there is a clear exit path.');
    if (ctx.assets !== 'none') prevent.push('Keep critical equipment (' + ctx.assets + ' to the flame) shielded or isolated from fuel handling areas.');
    if (F.Qpk > 30) insights.push('Radiated power reaches about ' + fmt(F.Qpk, 0) + ' W from a single droplet-sized flame. Heat flux on nearby surfaces can ignite other materials.');
    if (F.DextHot) insights.push('The hot flame goes out by radiation at about ' + fmt(F.DextHot, 2) + ' mm, but ' + (F.DextCool != null ? 'the cool flame keeps burning down to about ' + fmt(F.DextCool, 2) + ' mm. ' : '') + 'A flame that looks out may not be.');
    const monitoring = R.monitoring.slice();
    return { immediate, precautions, prevent, insights, monitoring };
  }

  /* ---------- what-if sensitivity ---------- */
  function sensitivity(F, ctx) {
    const base = { fuel: F.fuel, P: F.P, D0: F.mode === 'cool' || F.mode === 'osc' ? undefined : F.D0 };
    const regime = F.mode === 'cool' ? 'cool' : F.mode === 'osc' ? 'osc' : 'auto';
    const run = (dP, dctx) => {
      const c = Object.assign({}, CFG.defaultContext, ctx, dctx || {});
      const raw = { fuel: F.fuel, P: clamp(F.P * (dP || 1), 0.3, 8), D0: F.D0, mode: regime === 'auto' ? 'hot+cool' : regime };
      return assess(completeFeatures(raw, c), c).composite;
    };
    const b = run(1, {});
    const c0 = Object.assign({}, CFG.defaultContext, ctx);
    const list = [
      ['Pressure halved', run(0.5, {})],
      ['Pressure doubled', run(2, {})],
      ['Oxygen 3 points lower', run(1, { O2: Math.max(15, c0.O2 - 3) })],
      ['Oxygen 3 points higher', run(1, { O2: c0.O2 + 3 })],
      ['Half the fuel on hand', run(1, { fuelLoadG: c0.fuelLoadG / 2 })],
      ['Crew 3 m farther away', run(1, { crewDistM: c0.crewDistM + 3 })],
      ['Humidity raised to 55 %', run(1, { humidity: 55 })],
      ['Critical equipment moved away', run(1, { assets: 'none' })]
    ].map(([label, s]) => ({ label, score: s, delta: s - b }));
    return { base: b, list };
  }

  /* ---------- measured series (CSV) to features ---------- */
  function featuresFromSeries(cols, meta) {
    const t = cols.t, n = t.length; const out = { fuel: meta.fuel, P: meta.P, mode: meta.mode || 'hot+cool', D0: meta.D0 || (cols.D ? cols.D[0] : null) };
    const mx = a => a ? Math.max(...a.filter(Number.isFinite)) : null;
    out.Tpk = cols.T ? mx(cols.T) : null; out.Qpk = cols.Q ? mx(cols.Q) : null;
    if (cols.Df) {
      let i = 0; while (i < n - 1 && cols.Df[i + 1] <= cols.Df[i]) i++;
      out.DfMax = Math.max(...cols.Df.slice(i)); out.growth = growthOf(t.slice(i), cols.Df.slice(i), 1.0);
    }
    out.tBurn = t[n - 1] - t[0];
    if (cols.D && out.D0) { const done = t.findIndex((x, i) => cols.D[i] < 0.05 * out.D0); out.tBurn = done > 0 ? t[done] - t[0] : out.tBurn; out.K = out.D0 * out.D0 / out.tBurn; }
    if (cols.T && cols.D) {
      const ip = cols.T.indexOf(out.Tpk); let dh = null, dc = null;
      for (let i = ip; i < n; i++) { if (dh === null && cols.T[i] < 1200) dh = cols.D[i]; if (dh !== null && cols.T[i] < 800) { dc = cols.D[i]; break; } }
      out.DextHot = dh; out.DextCool = dc;
    }
    if (cols.T) { const tail = cols.T.slice(Math.floor(n * 0.6)).sort((a, b) => a - b); out.Tcool = tail[Math.floor(tail.length / 2)]; }
    out.src = {}; for (const k of Object.keys(out)) if (out[k] != null && k !== 'src') out.src[k] = 'data';
    return out;
  }

  g.MGF = { simulate, completeFeatures, assess, sensitivity, featuresFromSeries, ramp, clamp, fmt, LEVELS, Kcool, coolShape, hotShape, TpkHot, Tcool, dextFor, hrr };
})(window);
