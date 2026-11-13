/* Small inline illustrations used on the dashboard (benefit tiles, Earth vs space flame).
   They are drawn with SVG so they follow the light and dark themes. Edit freely. */
(function (g) {
  const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (cx, cy, radii) => pts(radii.map((r, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }));

  const V = {};

  /* six sensor channels: a camera sees a small shape, all six see the cool flame */
  V.radar = () => `<svg viewBox="0 0 220 170" role="img" aria-label="Radar chart: a camera sees a small part of the flame, six sensor channels together see all of it">
    <g fill="none" stroke="var(--line)" stroke-width="1">${[22, 44, 66].map(r => `<polygon points="${pts(hex(110, 85, r))}"/>`).join('')}${hex(110, 85, 66).map(p => `<line x1="110" y1="85" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}"/>`).join('')}</g>
    <polygon points="${poly(110, 85, [60, 52, 62, 56, 46, 58])}" fill="var(--cool)" fill-opacity=".16" stroke="var(--cool)" stroke-width="1.6"/>
    <polygon points="${poly(110, 85, [30, 12, 8, 10, 14, 9])}" fill="var(--hot)" fill-opacity=".30" stroke="var(--hot)" stroke-width="1.6"/>
    <g font-family="var(--f-data)" font-size="8.5" fill="var(--muted)"><text x="110" y="10" text-anchor="middle">visible</text><text x="178" y="48">infrared</text><text x="178" y="130">UV</text><text x="110" y="166" text-anchor="middle">Schlieren</text><text x="42" y="130" text-anchor="end">gas</text><text x="42" y="48" text-anchor="end">heat</text></g>
  </svg>`;

  /* decision tree */
  V.tree = () => `<svg viewBox="0 0 320 130" role="img" aria-label="A decision tree running from collect and analyze to a fire check, an evaluation and three response branches">
    <g fill="none" stroke="var(--line)" stroke-width="1.6" stroke-linecap="round"><path d="M64 24H92M148 24H171M211 24H226"/><path d="M254 38V62M254 62H168M254 62H305M305 62V92" /><path d="M168 62V92"/></g>
    <path d="M64 24H92M148 24H171M211 24H226M254 38V92" fill="none" stroke="var(--hot)" stroke-width="2" stroke-linecap="round"/>
    <g font-family="var(--f-data)" font-size="9" text-anchor="middle">
      <rect x="8" y="10" width="56" height="28" rx="7" fill="var(--surface2)" stroke="var(--line)"/><text x="36" y="28" fill="var(--text)">collect</text>
      <rect x="92" y="10" width="56" height="28" rx="7" fill="var(--surface2)" stroke="var(--line)"/><text x="120" y="28" fill="var(--text)">analyze</text>
      <path d="M191 2l20 22-20 22-20-22z" fill="var(--surface2)" stroke="var(--hot)" stroke-width="1.4"/><text x="191" y="27.5" fill="var(--hot)" font-size="8.5">fire?</text>
      <rect x="226" y="10" width="56" height="28" rx="7" fill="var(--hot)" fill-opacity=".16" stroke="var(--hot)"/><text x="254" y="28" fill="var(--text)">evaluate</text>
      <rect x="140" y="92" width="56" height="26" rx="7" fill="var(--surface2)" stroke="var(--line)"/><text x="168" y="108" fill="var(--muted)">monitor</text>
      <rect x="226" y="92" width="56" height="26" rx="7" fill="var(--hot)" stroke="var(--hot)"/><text x="254" y="108" fill="#1a0c00" font-weight="700">respond</text>
      <rect x="292" y="92" width="26" height="26" rx="7" fill="var(--surface2)" stroke="var(--line)"/><text x="305" y="108" fill="var(--muted)">end</text>
    </g></svg>`;

  /* droplet burn history */
  V.burn = () => {
    const N = 40, drop = [], flame = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = 10 + t * 200;
      const d2 = t < .55 ? 1 - t * 1.25 : (1 - .55 * 1.25) - (t - .55) * .6;
      drop.push([x, 90 - Math.max(0, d2) * 62]);
      const df = t < .55 ? Math.sin(Math.min(1, t / .55) * Math.PI * .5) * 1 : .38 + Math.sin((t - .55) * 9) * .05;
      flame.push([x, 90 - df * 70]);
    }
    return `<svg viewBox="0 0 220 110" role="img" aria-label="Droplet size shrinking and flame diameter over a burn, with a drop to a cool flame">
      <g stroke="var(--line)" stroke-width="1"><line x1="10" y1="90" x2="214" y2="90"/><line x1="10" y1="12" x2="10" y2="90"/><line x1="120" y1="14" x2="120" y2="90" stroke-dasharray="3 4"/></g>
      <polyline points="${pts(flame)}" fill="none" stroke="var(--hot)" stroke-width="2.2" stroke-linejoin="round"/>
      <polyline points="${pts(drop)}" fill="none" stroke="var(--cool)" stroke-width="2.2" stroke-linejoin="round"/>
      <g font-family="var(--f-data)" font-size="8.5" fill="var(--muted)"><text x="124" y="24">hot flame goes out</text><text x="14" y="104">time</text></g>
    </svg>`;
  };

  /* sliders */
  V.sliders = () => `<svg viewBox="0 0 220 110" role="img" aria-label="Three sliders for pressure, oxygen and droplet size">
    ${[['pressure', 62, 24], ['oxygen', 130, 55], ['droplet', 94, 86]].map(([t, x, y]) => `<g><text x="8" y="${y - 8}" font-family="var(--f-data)" font-size="9" fill="var(--muted)">${t}</text><rect x="8" y="${y - 2}" width="204" height="5" rx="2.5" fill="var(--line)"/><rect x="8" y="${y - 2}" width="${x}" height="5" rx="2.5" fill="var(--cool)"/><circle cx="${8 + x}" cy="${y + .5}" r="7.5" fill="var(--surface)" stroke="var(--cool)" stroke-width="2.4"/></g>`).join('')}
  </svg>`;

  /* summary vs detail */
  V.depth = () => `<svg viewBox="0 0 220 110" role="img" aria-label="A one-line summary beside a detailed breakdown">
    <rect x="6" y="8" width="92" height="94" rx="10" fill="var(--surface2)" stroke="var(--line)"/><rect x="16" y="20" width="46" height="18" rx="9" fill="var(--high-bg)" stroke="var(--high)"/><text x="39" y="33" text-anchor="middle" font-family="var(--f-data)" font-size="9.5" font-weight="700" fill="var(--high)">High</text>
    <g fill="var(--line)"><rect x="16" y="52" width="70" height="5" rx="2.5"/><rect x="16" y="64" width="54" height="5" rx="2.5"/><rect x="16" y="76" width="62" height="5" rx="2.5"/></g>
    <rect x="112" y="8" width="102" height="94" rx="10" fill="var(--surface2)" stroke="var(--line)"/>
    ${[['', 70], ['', 52], ['', 82], ['', 36], ['', 60]].map((r, i) => `<g><rect x="122" y="${20 + i * 15}" width="82" height="6" rx="3" fill="var(--line)"/><rect x="122" y="${20 + i * 15}" width="${r[1] * .82}" height="6" rx="3" fill="${i === 2 ? 'var(--hot)' : 'var(--cool)'}"/></g>`).join('')}
  </svg>`;

  /* report: gauge */
  V.report = () => {
    const a = Math.PI * (1 - .62), cx = 90, cy = 90, r = 62, x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
    const arc = (f0, f1, c) => { const p = f => [cx + Math.cos(Math.PI * (1 - f)) * r, cy - Math.sin(Math.PI * (1 - f)) * r]; const A = p(f0), B = p(f1); return `<path d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}A${r} ${r} 0 0 1 ${B[0].toFixed(1)} ${B[1].toFixed(1)}" stroke="${c}" stroke-width="11" fill="none"/>`; };
    return `<svg viewBox="0 0 330 110" role="img" aria-label="A risk gauge in the high band beside a short action list">
      ${arc(0, .3, 'var(--low)')}${arc(.3, .48, 'var(--mod)')}${arc(.48, .66, 'var(--high)')}${arc(.66, 1, 'var(--crit)')}
      <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="var(--text)"/>
      <g font-family="var(--f-data)" font-size="10"><text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="var(--high)" font-weight="700">High risk</text></g>
      <g transform="translate(196 12)" fill="var(--line)">${[0, 1, 2, 3].map(i => `<g><circle cx="6" cy="${8 + i * 24}" r="5" fill="${i === 0 ? 'var(--hot)' : 'var(--cool)'}"/><rect x="20" y="${5 + i * 24}" width="${[96, 82, 100, 70][i]}" height="6" rx="3"/></g>`).join('')}</g>
    </svg>`;
  };

  /* Earth flame (teardrop with rising plume) and space flame (sphere) */
  V.earth = () => `<svg viewBox="0 0 220 250" role="img" aria-label="On Earth a flame is a teardrop and smoke rises">
    <defs><radialGradient id="ef" cx="50%" cy="78%" r="60%"><stop offset="0" stop-color="#fff6d6"/><stop offset=".35" stop-color="#ffb347"/><stop offset="1" stop-color="#e8541a" stop-opacity=".85"/></radialGradient><filter id="efb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    <g fill="none" stroke="#9fb1d2" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"><path d="M110 70c-14-14 12-24-2-40" /><path d="M96 70c-14-12 10-22-2-36" opacity=".6"/><path d="M124 70c-14-12 10-22-2-36" opacity=".6"/></g>
    <g filter="url(#efb)" opacity=".45"><path d="M110 40C128 80 154 118 154 160a44 44 0 0 1-88 0C66 118 92 80 110 40z" fill="#ff8a2b"/></g>
    <path d="M110 52C128 90 152 124 152 160a42 42 0 0 1-84 0C68 124 92 90 110 52z" fill="url(#ef)"/>
    <path d="M110 128c10 16 20 26 20 40a20 20 0 0 1-40 0c0-14 10-24 20-40z" fill="#4aa8ff" fill-opacity=".85"/>
    <rect x="96" y="204" width="28" height="14" rx="4" fill="#3a4766"/><rect x="104" y="196" width="12" height="10" fill="#3a4766"/>
  </svg>`;
  V.space = () => `<svg viewBox="0 0 220 250" role="img" aria-label="In microgravity a flame is a sphere around the fuel droplet">
    <defs><radialGradient id="sf" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe9b8" stop-opacity="0"/><stop offset=".55" stop-color="#ffb347" stop-opacity=".25"/><stop offset=".78" stop-color="#ff9a3c"/><stop offset=".9" stop-color="#e8541a" stop-opacity=".7"/><stop offset="1" stop-color="#e8541a" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc" cx="50%" cy="50%" r="50%"><stop offset=".7" stop-color="#5bc6ff" stop-opacity="0"/><stop offset=".92" stop-color="#5bc6ff" stop-opacity=".35"/><stop offset="1" stop-color="#5bc6ff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="110" cy="125" r="100" fill="url(#sc)"/><circle cx="110" cy="125" r="68" fill="url(#sf)"/>
    <circle cx="110" cy="125" r="48" fill="none" stroke="#2b1a10" stroke-opacity=".5" stroke-width="10" /><circle cx="110" cy="125" r="9" fill="#d9e6ff"/>
    <g fill="none" stroke="#9fb1d2" stroke-opacity=".38" stroke-width="1" stroke-dasharray="2 4"><circle cx="110" cy="125" r="100"/><ellipse cx="110" cy="125" rx="100" ry="30"/></g>
  </svg>`;

  /* line icons */
  const ic = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  V.icons = {
    eye: ic('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    tree: ic('<rect x="9" y="3" width="6" height="5" rx="1.2"/><rect x="3" y="16" width="6" height="5" rx="1.2"/><rect x="15" y="16" width="6" height="5" rx="1.2"/><path d="M12 8v4M6 16v-4h12v4"/>'),
    data: ic('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
    sliders: ic('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
    layers: ic('<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    report: ic('<path d="M7 3h8l4 4v14H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>')
  };
  g.MGFVis = V;
})(window);
