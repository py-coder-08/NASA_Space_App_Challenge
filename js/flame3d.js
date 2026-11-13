/* ============================================================
   REAL-TIME 3D FLAME  (plain WebGL, no library)
   The flame is drawn as nested glowing shells around a fuel droplet.
   A ray is marched through the volume for every pixel, so the picture is
   truly 3D: drag to rotate. Size, colour and shape come from the same
   droplet-burning model the risk engine uses (MGF.simulate).
   ============================================================ */
(function (g) {
  const E = g.MGF, CFG = g.MGF_CONFIG;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ramp = (x, lo, hi) => clamp((x - lo) / (hi - lo), 0, 1);

  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const FS = `precision highp float;
uniform vec2 uRes; uniform vec3 uCam, uRight, uUp, uFwd; uniform float uTan, uTime;
uniform float uRh, uRc, uRd, uHot, uCool, uSoot, uInt, uSD, uSU, uOsc, uFlick, uThin, uGrid;
uniform vec3 uHotCol, uCoolCol;
float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float nz(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTan);
  vec3 ro = uCam;
  vec3 bg = mix(vec3(0.045, 0.075, 0.14), vec3(0.012, 0.022, 0.05), clamp(length(uv) * 1.25, 0.0, 1.0));
  float B = max(uRh, uRc) * max(uSD, 1.0) * 1.45 + 1.5;
  float b = dot(ro, rd), c = dot(ro, ro) - B * B, disc = b * b - c;
  float cd = dot(ro, ro) - uRd * uRd, dd = b * b - cd, tD = 1e9;
  if (dd > 0.0) tD = -b - sqrt(dd);
  float T = 1.0; vec3 acc = vec3(0.0);
  if (disc > 0.0) {
    float t0 = max(-b - sqrt(disc), 0.0), t1 = -b + sqrt(disc);
    float dt = (t1 - t0) / 56.0;
    for (int i = 0; i < 56; i++) {
      float t = t0 + (float(i) + 0.5) * dt;
      if (t > tD) break;
      vec3 p = ro + rd * t;
      vec3 q = p; q.x = q.x > 0.0 ? q.x / uSD : q.x / uSU;
      float r = length(q); vec3 dn = q / max(r, 0.001);
      float wob = uFlick * (nz(dn * 2.4 + vec3(0.0, 0.0, uTime * 0.9)) - 0.5) * 2.0 + uOsc * sin(uTime * 7.0 + dn.y * 2.0 + dn.x);
      float rr = r / (1.0 + wob);
      float thH = (0.085 * uRh + 0.25) * uThin, thC = (0.14 * uRc + 0.3) * uThin;
      float hs = exp(-pow((rr - uRh) / thH, 2.0));
      float cs = exp(-pow((rr - uRc) / thC, 2.0));
      float fill = (1.0 - smoothstep(0.0, uRh, rr)) * 0.015;
      float sz = smoothstep(uRd * 1.1, uRh * 0.55, rr) * (1.0 - smoothstep(uRh * 0.72, uRh * 0.97, rr));
      vec3 em = uHotCol * uHot * (hs * 1.25 + fill) * uInt + uCoolCol * uCool * cs * 0.55;
      acc += T * em * dt * 0.20;
      T *= exp(-uSoot * sz * 0.55 * dt);
    }
  }
  vec3 col;
  if (tD < 1e9) {
    vec3 p = ro + rd * tD, n = normalize(p), L = normalize(vec3(-0.45, 0.6, 0.65));
    float l = max(dot(n, L), 0.0), rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
    vec3 s = vec3(0.55, 0.68, 0.92) * (0.22 + 0.78 * l) + vec3(0.95) * pow(l, 28.0) * 0.5 + uHotCol * uHot * (0.18 + 0.4 * rim) + uCoolCol * uCool * 0.25 * rim;
    col = s * T + acc;
  } else col = bg * T + acc;
  // faint measuring sphere (20 mm radius) so rotation and scale read clearly
  if (uGrid > 0.0) {
    float Rg = 20.0, bb = dot(ro, rd), cc = dot(ro, ro) - Rg * Rg, dq = bb * bb - cc;
    if (dq > 0.0) {
      float tg = -bb - sqrt(dq);
      if (tg > 0.0 && tg < min(tD, 1e8)) {
        vec3 n = normalize(ro + rd * tg);
        float lat = abs(fract(asin(clamp(n.y, -1.0, 1.0)) / 0.5236 + 0.5) - 0.5), lon = abs(fract(atan(n.z, n.x) / 0.5236 + 0.5) - 0.5);
        float ln = max(1.0 - smoothstep(0.0, 0.03, lat), 1.0 - smoothstep(0.0, 0.03, lon * max(0.25, sqrt(1.0 - n.y * n.y))));
        col += vec3(0.25, 0.55, 0.9) * ln * 0.12 * uGrid;
      }
    }
  }
  col = 1.0 - exp(-col * 1.55);
  col = pow(col, vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}`;

  /* temperature (K) to flame colour. Cool flames are pale blue-violet. */
  const HOT_STOPS = [[700, [0.30, 0.04, 0.03]], [1100, [0.85, 0.16, 0.04]], [1500, [1.0, 0.36, 0.05]], [2000, [1.0, 0.58, 0.14]], [2500, [1.0, 0.80, 0.36]], [2900, [1.0, 0.93, 0.70]]];
  function hotColor(T, O2) {
    let c = HOT_STOPS[HOT_STOPS.length - 1][1];
    for (let i = 1; i < HOT_STOPS.length; i++) if (T <= HOT_STOPS[i][0]) { const a = HOT_STOPS[i - 1], b = HOT_STOPS[i], t = (T - a[0]) / (b[0] - a[0]); c = [mix(a[1][0], b[1][0], t), mix(a[1][1], b[1][1], t), mix(a[1][2], b[1][2], t)]; break; }
    const w = ramp(O2 || 21, 22, 40) * 0.5;               // oxygen-rich flames turn whiter and bluer
    return [mix(c[0], 0.85, w), mix(c[1], 0.92, w), mix(c[2], 1.0, w)];
  }
  const coolColor = T => { const k = ramp(T, 600, 1200); return [mix(0.20, 0.38, k), mix(0.38, 0.50, k), 1.0]; };

  /* simulation state at a point in the burn -> what the 3D scene should show */
  function frameFrom(sim, progress, o) {
    const N = sim.t.length - 1, i = clamp(Math.round(progress * N), 0, N), t = sim.t[i];
    const D = sim.D[i], Df = sim.Df[i], T = sim.T[i], Q = sim.Q[i];
    const coolOnly = sim.mode === 'cool' || sim.mode === 'osc';
    const hotStage = !coolOnly && t <= sim.t1 + 1e-9;
    const hotW = hotStage ? ramp(t, 0, 0.25) * (1 - ramp(t, sim.t1 * 0.97, sim.t1)) * (sim.mode === 'hot' ? 1 : 1) : 0;
    const coolW = hotStage ? 0 : 1;
    const v = o.vent || 0, s = clamp(v / 30, 0, 1.5);
    const sootS = ramp(o.soot ?? 8, 1, 40);
    const stage = coolOnly ? 'Cool flame' : hotStage ? (sim.mode === 'hot' ? 'Hot flame to the end' : 'Hot flame') : 'Cool flame after radiative extinction';
    return {
      frame: {
        Rh: Math.max(0.25, (hotStage ? Df : Df) / 2), Rc: Math.max(0.25, Df / 2), Rd: Math.max(0.05, D / 2),
        hot: hotW, cool: coolW * (coolOnly ? 0.9 : 0.8), soot: hotStage ? sootS : sootS * 0.15, intensity: clamp(Q / 40, 0.2, 1.3) * (hotStage ? 1 : 0.6),
        hotCol: hotColor(T, o.O2), coolCol: coolColor(T), sD: 1 + 0.7 * s, sU: Math.max(0.65, 1 - 0.22 * s),
        osc: sim.mode === 'osc' ? 0.16 : 0, flick: coolOnly ? 0.07 : 0.035, thin: clamp(1.15 - 0.1 * Math.log2(Math.max(0.5, o.P || 1)), 0.7, 1.3)
      },
      read: { t, D, Df, T, Q, stage, progress: i / N }
    };
  }

  function create(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) || canvas.getContext('experimental-webgl');
    if (!gl) return { supported: false, setFrame() {}, destroy() {}, fit() {}, pxPerMM: () => 1, setAuto() {}, setLock() {}, zoom() {} };
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uCam', 'uRight', 'uUp', 'uFwd', 'uTan', 'uTime', 'uRh', 'uRc', 'uRd', 'uHot', 'uCool', 'uSoot', 'uInt', 'uSD', 'uSU', 'uOsc', 'uFlick', 'uThin', 'uGrid', 'uHotCol', 'uCoolCol'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

    const cur = { Rh: 10, Rc: 10, Rd: 2, hot: 1, cool: 0, soot: 0.3, intensity: 1, sD: 1, sU: 1, osc: 0, flick: 0.035, thin: 1, half: 36, hotCol: [1, 0.6, 0.15], coolCol: [0.4, 0.55, 1] };
    let tgt = Object.assign({}, cur, { hotCol: cur.hotCol.slice(), coolCol: cur.coolCol.slice() });
    const cam = { yaw: opts.yaw ?? 0.7, pitch: opts.pitch ?? 0.28 };
    const st = { lock: opts.lock !== false, auto: !!opts.auto, grid: opts.grid === false ? 0 : 1, dragging: false, visible: true, raf: 0, last: performance.now(), t: 0, zoom: 1, W: 1, H: 1 };
    const FOV = 0.26; // tan(half fov)

    function size() { const dpr = Math.min(1.5, devicePixelRatio || 1), r = canvas.getBoundingClientRect(); st.W = Math.max(2, Math.round(r.width * dpr)); st.H = Math.max(2, Math.round(r.height * dpr)); canvas.width = st.W; canvas.height = st.H; gl.viewport(0, 0, st.W, st.H); }
    const ro = new ResizeObserver(size); ro.observe(canvas); size();
    const io = new IntersectionObserver(es => { st.visible = es[0].isIntersecting; kick(); }); io.observe(canvas);

    function targetHalf() { return st.lock ? 36 * st.zoom : clamp(Math.max(tgt.Rh, tgt.Rc) * Math.max(tgt.sD, 1) * 1.5, 3, 60) * st.zoom; }
    function draw(now) {
      st.raf = 0;
      if (!st.visible || document.hidden || !canvas.offsetParent) return;
      const dt = Math.min(0.1, (now - st.last) / 1000); st.last = now; st.t += dt;
      const k = 1 - Math.exp(-dt * 9);
      ['Rh', 'Rc', 'Rd', 'hot', 'cool', 'soot', 'intensity', 'sD', 'sU', 'osc', 'flick', 'thin'].forEach(n => cur[n] = mix(cur[n], tgt[n], k));
      cur.half = mix(cur.half, targetHalf(), 1 - Math.exp(-dt * 5));
      for (let i = 0; i < 3; i++) { cur.hotCol[i] = mix(cur.hotCol[i], tgt.hotCol[i], k); cur.coolCol[i] = mix(cur.coolCol[i], tgt.coolCol[i], k); }
      if (st.auto && !st.dragging) cam.yaw += dt * 0.28;
      const dist = cur.half / FOV, cp = Math.cos(cam.pitch), eye = [dist * cp * Math.sin(cam.yaw), dist * Math.sin(cam.pitch), dist * cp * Math.cos(cam.yaw)];
      const f = eye.map(v => -v / dist), up0 = [0, 1, 0];
      const rt = [f[1] * up0[2] - f[2] * up0[1], f[2] * up0[0] - f[0] * up0[2], f[0] * up0[1] - f[1] * up0[0]], rl = Math.hypot(...rt); rt.forEach((v, i) => rt[i] = v / rl);
      const upv = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
      gl.uniform2f(U.uRes, st.W, st.H); gl.uniform3fv(U.uCam, eye); gl.uniform3fv(U.uRight, rt); gl.uniform3fv(U.uUp, upv); gl.uniform3fv(U.uFwd, f);
      gl.uniform1f(U.uTan, FOV); gl.uniform1f(U.uTime, st.t);
      gl.uniform1f(U.uRh, cur.Rh); gl.uniform1f(U.uRc, cur.Rc); gl.uniform1f(U.uRd, cur.Rd); gl.uniform1f(U.uHot, cur.hot); gl.uniform1f(U.uCool, cur.cool);
      gl.uniform1f(U.uSoot, cur.soot); gl.uniform1f(U.uInt, cur.intensity); gl.uniform1f(U.uSD, cur.sD); gl.uniform1f(U.uSU, cur.sU);
      gl.uniform1f(U.uOsc, cur.osc); gl.uniform1f(U.uFlick, cur.flick); gl.uniform1f(U.uThin, cur.thin); gl.uniform1f(U.uGrid, st.grid);
      gl.uniform3fv(U.uHotCol, cur.hotCol); gl.uniform3fv(U.uCoolCol, cur.coolCol);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (opts.onFrame) opts.onFrame(cur);
      kick();
    }
    function kick() { if (!st.raf && st.visible && !document.hidden) st.raf = requestAnimationFrame(draw); }
    document.addEventListener('visibilitychange', () => { st.last = performance.now(); kick(); });

    /* drag to rotate (mouse, touch, pen) and arrow keys */
    let px = 0, py = 0;
    canvas.style.touchAction = 'none'; canvas.tabIndex = 0;
    canvas.addEventListener('pointerdown', e => { st.dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', e => { if (!st.dragging) return; cam.yaw -= (e.clientX - px) * 0.008; cam.pitch = clamp(cam.pitch + (e.clientY - py) * 0.008, -1.35, 1.35); px = e.clientX; py = e.clientY; });
    const end = () => { st.dragging = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.style.cursor = 'grab';
    canvas.addEventListener('keydown', e => { const m = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key]; if (m) { e.preventDefault(); cam.yaw += m[0]; cam.pitch = clamp(cam.pitch + m[1], -1.35, 1.35); } });
    kick();

    return {
      supported: true,
      setFrame(fr) { tgt = Object.assign({}, cur, fr, { half: cur.half }); tgt.hotCol = fr.hotCol.slice(); tgt.coolCol = fr.coolCol.slice(); kick(); },
      setAuto(v) { st.auto = !!v; }, setLock(v) { st.lock = !!v; kick(); },
      zoom(f) { st.zoom = clamp(st.zoom * f, 0.4, 2.5); kick(); }, fit() { st.zoom = 1; st.lock = false; kick(); },
      setGrid(v) { st.grid = v ? 1 : 0; }, resetCamera() { cam.yaw = 0.7; cam.pitch = 0.28; },
      pxPerMM() { return canvas.clientHeight / (2 * cur.half); }, half: () => cur.half,
      destroy() { cancelAnimationFrame(st.raf); ro.disconnect(); io.disconnect(); }
    };
  }
  g.MGFFlame = { create, frameFrom, hotColor, coolColor };
})(window);
