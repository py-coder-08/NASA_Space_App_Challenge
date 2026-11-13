/* Guided tour: spotlight pop-ups that walk a new user through a page.
   Step text lives in js/content.js (section "tour"). Targets are listed below. */
(function (g) {
  const DEFS = {
    lab: [
      ['tabs', '.toolbar .seg[aria-label="Data source"]'], ['sets', '#aside .dslist, #aside #o_fuel'], ['cabin', '#ctxFold'], ['depth', '.toolbar .seg[aria-label="Depth of analysis"]'],
      ['verdict', '.verdict'], ['flame', '#flameCard'], ['charts', '#charts'], ['tree', '#tree'], ['report', '#report']
    ],
    dashboard: [['stage', '.sphere'], ['benefits', '#benefits'], ['ranking', '#ranking'], ['library', '#library'], ['nav', '.nav']],
    method: [['factors', '#m-factors .factor'], ['sandbox', '#m-try .sandbox']]
  };
  let root = null, steps = [], i = 0, page = '', opener = null;
  const vis = el => el && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0;
  const seenKey = n => 'mgf-tour-' + n;
  const seen = n => { try { return localStorage.getItem(seenKey(n)) === '1'; } catch (e) { return false; } };
  const mark = n => { try { localStorage.setItem(seenKey(n), '1'); } catch (e) {} };
  const T = () => g.MGF_CONTENT.tour;

  function close(done) { if (!root) return; mark(page); root.remove(); root = null; removeEventListener('resize', place); removeEventListener('scroll', place, true); removeEventListener('keydown', key, true); if (opener && document.contains(opener)) opener.focus(); }
  function key(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); }
  function go(d) { const n = i + d; if (n < 0) return; if (n >= steps.length) return close(true); i = n; show(); }

  function place() {
    if (!root) return; const s = steps[i], el = s.el; if (!vis(el)) return;
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, pad = 8;
    const spot = root.querySelector('.tour-spot'), card = root.querySelector('.tour-card');
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), w = Math.min(vw - 8, r.width + pad * 2), h = Math.min(vh - 8, r.height + pad * 2);
    Object.assign(spot.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    const cw = Math.min(380, vw - 24); card.style.width = cw + 'px'; const ch = card.offsetHeight;
    let top, left = clampN(r.left, 12, vw - cw - 12);
    const below = vh - (r.bottom + pad), above = r.top - pad;
    if (below >= ch + 16) top = r.bottom + pad + 12; else if (above >= ch + 16) top = r.top - pad - ch - 12;
    else { top = vh - ch - 16; left = clampN((vw - cw) / 2, 12, vw); }
    card.style.top = clampN(top, 12, vh - ch - 12) + 'px'; card.style.left = left + 'px';
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

  function show() {
    const s = steps[i], tx = T();
    s.el.scrollIntoView({ block: 'center', inline: 'nearest' });
    root.querySelector('.tour-count').textContent = (i + 1) + ' of ' + steps.length;
    root.querySelector('h3').textContent = s.title; root.querySelector('p').textContent = s.body;
    const next = root.querySelector('[data-t=next]'); next.textContent = i === steps.length - 1 ? tx.done : tx.next;
    root.querySelector('[data-t=back]').hidden = i === 0;
    root.querySelector('.tour-dots').innerHTML = steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    place(); requestAnimationFrame(place); next.focus({ preventScroll: true });
  }

  function start(name) {
    const tx = T(); page = name; opener = document.activeElement;
    steps = (DEFS[name] || []).map(([id, sel]) => { const el = Array.from(document.querySelectorAll(sel)).find(vis); const t = tx[name] && tx[name][id]; return el && t ? { el, title: t.title, body: t.body } : null; }).filter(Boolean);
    if (!steps.length) return;
    if (root) root.remove();
    root = document.createElement('div'); root.className = 'tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Guided tour');
    root.innerHTML = `<div class="tour-block"></div><div class="tour-spot"></div><div class="tour-card"><div class="tour-count mono"></div><h3></h3><p></p><div class="tour-dots"></div><div class="tour-actions"><button class="btn sm ghost" data-t="skip">${tx.skip}</button><span style="flex:1"></span><button class="btn sm ghost" data-t="back">${tx.back}</button><button class="btn sm" data-t="next">${tx.next}</button></div></div>`;
    document.body.appendChild(root);
    root.querySelector('[data-t=skip]').onclick = () => close();
    root.querySelector('[data-t=back]').onclick = () => go(-1);
    root.querySelector('[data-t=next]').onclick = () => go(1);
    root.querySelector('.tour-block').onclick = () => close();
    addEventListener('resize', place); addEventListener('scroll', place, true); addEventListener('keydown', key, true);
    i = 0; show();
  }

  /* floating "Guide me" button, one per page */
  let fab = null;
  function fabFor(name) {
    if (!fab) { fab = document.createElement('button'); fab.className = 'guide-fab'; document.body.appendChild(fab); }
    if (!DEFS[name]) { fab.hidden = true; return; }
    fab.hidden = false; fab.textContent = T().guide; fab.setAttribute('aria-label', 'Start the guided tour for this page'); fab.onclick = () => start(name);
  }
  function auto(name) { if (!seen(name)) setTimeout(() => { if (!document.querySelector('.tour') && DEFS[name] && document.querySelector(DEFS[name][0][1].split(',')[0]) && vis(document.querySelector(DEFS[name][0][1].split(',')[0]))) start(name); }, 700); }
  g.MGFTour = { start, fabFor, auto, seen };
})(window);
