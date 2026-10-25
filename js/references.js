/* ============================================================
   REFERENCES PAGE  (safe to edit)
   Each source has a summary written from the page itself, a few key
   points, and a list of the places in Ember Watch that use it.
   "go" can be: lab, method or dashboard.
   ============================================================ */
window.MGF_REFS = [
  {
    id: 'jpl', type: 'NASA JPL Microdevices Laboratory', title: 'Fire safety in space: spacecraft fire detection',
    url: 'https://microdevices.jpl.nasa.gov/capabilities/in-situ-instruments-tls/spacecraft-fire/',
    summary: 'Fire is especially dangerous inside a crewed spacecraft, and earlier NASA fire studies on the shuttle and the ISS were limited in size and scope. The Spacecraft Fire Experiment (Saffire), led by NASA Glenn, runs full-scale fires on unmanned Cygnus supply vehicles after they leave the station. JPL built a Combustion Product Monitor that uses compact semiconductor lasers to measure gases while a fire burns.',
    points: ['Gases measured: carbon monoxide, carbon dioxide and oxygen, plus trace hydrogen fluoride, hydrogen chloride and hydrogen cyanide.', 'Laser sensors give accurate readings across a broad range of pressures and temperatures and can run thousands of hours without maintenance.', 'The page describes the monitor as a testbed for sensors on future human spaceflight, including deep space.'],
    uses: [['Step 1 sensor channels: gas and environmental sensing', 'method'], ['Toxic gas factor: CO, O2 depletion, soot', 'method'], ['Cabin conditions: fuel on hand and free volume', 'lab']]
  },
  {
    id: 'svs', type: 'NASA Scientific Visualization Studio', title: 'NASA Studies Fire in Microgravity (SVS 31394)',
    url: 'https://svs.gsfc.nasa.gov/31394/',
    summary: 'A visual summary of NASA fire research on the ISS. Without gravity there is no buoyancy-driven airflow, so flames take a spherical shape instead of the teardrop of a candle on Earth. Gravity can hide combustion science on Earth, and the research helps protect astronauts who cannot leave a spacecraft during a fire, so materials should be non-flammable where possible.',
    points: ['The Combustion Integrated Rack is the main ISS facility for small flame studies. SoFIE fits inside it to study ignition and flammability of solid materials.', 'Saffire runs larger fire-spread experiments on Cygnus craft after they leave the station.', 'Some materials may be more flammable in partial gravity, which matters for the Moon.', 'A burning thin fabric sheet in still air brightens and dims in a repeating pattern as it draws in fresh oxygen.'],
    uses: [['Spherical flame in the 3D viewer and the hero', 'dashboard'], ['Pulsing flame: the oscillating cool-flame case', 'lab'], ['What changes in microgravity', 'dashboard']]
  },
  {
    id: 'why', type: 'NASA Biological and Physical Sciences', title: 'Why NASA is studying flames in space',
    url: 'https://science.nasa.gov/biological-physical/resources/explainers-infographics/why-nasa-is-studying-flames-in-space/',
    summary: 'NASA explains that controlled flames have been run safely in space for decades. Microgravity removes the buoyant flow that shapes flames on Earth, so the flame becomes spherical and researchers can study the basic physics. Fire safety is a main driver: astronauts cannot leave, so fire-resistant materials are preferred.',
    points: ['The Flame Extinguishment Experiment (FLEX) on the station produced a specific type of cool flame, which NASA calls a major breakthrough. Understanding cool flames could lead to more efficient, less-polluting vehicles.', 'Confined Combustion examined flame spread in confined spaces of different shapes. Results can guide structure design and fire codes on Earth.', 'Flammability of Materials on the Moon (FM2) is planned as the first flammability test on another world.', 'An image description notes a flame starting yellow and sooty, then turning bluer and smaller as pressure drops until it goes out.'],
    uses: [['Cool flames and the persistence and detectability factor', 'method'], ['Pressure slider: flame turns bluer and smaller at low pressure', 'lab'], ['Why the lab separates hot and cool flames', 'lab']]
  },
  {
    id: 'moon', type: 'News article (WESH 2)', title: 'NASA plans to light a fire on the Moon for the very first time',
    url: 'https://www.wesh.com/article/nasa-plans-to-light-a-fire-on-the-moon-for-the-very-first-time-heres-why/71887434',
    summary: 'The headline reports that NASA plans to light a fire on the Moon for the first time. This is the Flammability of Materials on the Moon experiment (FM2), which would fly to the lunar surface on a Commercial Lunar Payload Service mission. A self-contained chamber will burn four solid samples and watch the flames with cameras, radiometers and oxygen sensors.',
    points: ['On Earth, gravity-driven airflow can blow out marginal materials. On the Moon that flow is much slower, so materials that look safe on Earth could burn for a long time.', 'The aim is to improve fire safety for future crewed habitats and to improve on NASA-STD-6001B, the Earth-based flammability screening test.', 'The chamber should return minutes of data, compared with seconds from drop towers and parabolic flights.'],
    caveat: 'The WESH page could not be opened by the tools used to build this site. This summary combines its headline with NASA\'s own description of FM2 and independent coverage (ScienceAlert). Read the original article at the link for its exact wording and dates.',
    uses: [['Limit: Ember Watch models microgravity, not lunar gravity', 'method'], ['Next step: partial-gravity flames', 'dashboard']]
  },
  {
    id: 'cir', type: 'Encyclopedia article (Wikipedia)', title: 'Combustion Integrated Rack (CIR)',
    url: 'https://en.wikipedia.org/wiki/Combustion_Integrated_Rack',
    summary: 'The Combustion Integrated Rack is a reconfigurable experiment facility on the International Space Station for combustion research in microgravity. It is part of the Fluids and Combustion Facility and, per the article, the only combustion research facility on board. Experiments run by remote control from the Telescience Support Center at NASA Glenn.',
    points: ['A 100-litre combustion chamber with eight windows, operating from 0.02 atm up to 3 atm.', 'Five cameras for diagnostics and a gas chromatograph, with an optics bench and fuel and oxidizer management.', 'Droplet work included a methanol droplet about 2.5 mm across and a 3 mm heptane droplet burning in 33.4 % oxygen at 0.713 atm.', 'The same rack supports droplet, solid-fuel and gaseous-fuel combustion.'],
    uses: [['Droplet-combustion data files: the same family of experiments (single fuel droplets burning in microgravity)', 'dashboard'], ['Pressure range 0.5 to 5 atm in the lab and sliders', 'lab'], ['Oxygen-enriched atmospheres in the atmosphere factor', 'method']]
  },
  {
    id: 'video', type: 'NASA Johnson video (YouTube)', title: 'Combustion Integrated Rack (revised)',
    url: 'https://www.youtube.com/watch?v=kdf8ahuHJ0A',
    summary: 'A short NASA Johnson feature from a series on the experiment racks on the space station. It covers the Combustion Integrated Rack and three experiments: the Multi-User Droplet Combustion Apparatus, the Constrained Vapor Bubble and the Flame Extinguishment Experiment.',
    points: ['Useful as a visual introduction to how a droplet flame is set up, lit and filmed on the station.', 'Pairs with the 3D viewer: the same spherical droplet flame, seen from inside the experiment.'],
    caveat: 'This summary comes from the video page description only. The video\'s contents could not be reviewed in detail.',
    uses: [['3D flame viewer', 'lab'], ['Droplet burning (d-squared law) and extinction', 'method']]
  },
  {
    id: 'acme', type: 'NASA fact sheet (PDF)', title: 'Advanced Combustion via Microgravity Experiments (ACME)',
    url: 'https://www.nasa.gov/wp-content/uploads/2025/07/advanced-combustion-via-microgravity-experiments-acme.pdf',
    summary: 'ACME uses microgravity experiments on gaseous flames to improve combustion on Earth, mainly efficiency and emissions, with spacecraft fire prevention as a secondary goal. It studies soot, flame stability and extinction limits, oxygen-enriched burning, electric-field control and cool-flame chemistry.',
    points: ['Without buoyancy, flames become taller, wider and sootier. Reported soot volume fractions are five to eight times those in normal gravity.', 'Weak flames can stay stable at dilutions that would not sustain a flame on Earth.', 'Spherical flames allow one-dimensional analysis, which simplifies modelling.', 'The six experiments include s-Flame (spherical flame structure and pulsating instabilities) and Cool Flames Investigation with Gases (steady spherical cool diffusion flames).', 'Tests typically last 0.5 to 2 minutes in a chamber of about 90 litres.'],
    uses: [['Soot estimate and the soot shell in the 3D flame', 'lab'], ['Oscillating cool flame and pulsing instabilities', 'lab'], ['Spherical symmetry behind the d-squared model', 'method'], ['Soot and cool-flame assumptions', 'method']]
  }
];

/* How the research maps onto the site's mechanisms */
window.MGF_REFMAP = [
  ['Flames are spherical when nothing rises', 'SVS 31394, NASA explainer, ACME', 'Spherical shells in the 3D viewer, d-squared droplet model', 'lab'],
  ['Droplet burning, radiative extinction, extinction diameter', 'Combustion Integrated Rack, FLEX video', 'Simulation, extinction diameters, three-stage burn', 'method'],
  ['Cool flames burn at low temperature and are hard to see', 'NASA explainer (FLEX), ACME (CFI-G)', 'Persistence and detectability factor, IR / Schlieren channels', 'method'],
  ['Soot is heavier in microgravity', 'ACME (5 to 8 times normal gravity)', 'Soot estimate, soot absorption zone in 3D, gas factor', 'method'],
  ['Gas sensing: CO, CO2, O2 and toxic traces', 'JPL Combustion Product Monitor', 'Step 1 sensors, CO and oxygen-drop estimate', 'method'],
  ['Pressure and oxygen change the flame', 'CIR (0.02 to 3 atm, 33.4 % O2 test), NASA explainer', 'Pressure and oxygen sliders, atmosphere factor', 'lab'],
  ['Larger fires and different gravity', 'Saffire (JPL, SVS), FM2 (WESH, NASA)', 'Stated limits: scaling to a cabin and no lunar gravity yet', 'method']
];

(function (g) {
  function render() {
    const A = g.MGFApp, esc = A.esc, C = g.MGF_CONTENT.refs, root = A.$('#view-refs');
    const go = (label, where) => `<div class="use"><a class="go" href="#${where}" data-go="${where}">${where === 'lab' ? 'Lab' : where === 'method' ? 'Methodology' : 'Dashboard'}</a><span>${esc(label)}</span></div>`;
    root.innerHTML = `
      <div class="lab-head"><h1 style="font-size:clamp(1.9rem,4vw,2.8rem)">${esc(C.heading)}</h1><p>${esc(C.lead)}</p></div>
      <section class="band" style="padding-top:12px"><div class="sec-head"><h2>How the research connects to the site</h2></div>
        <div class="scroll"><table class="t"><thead><tr><th>Mechanism</th><th>Research basis</th><th>Where Ember Watch uses it</th><th></th></tr></thead><tbody>
        ${g.MGF_REFMAP.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td><a class="go tag" href="#${r[3]}" data-go="${r[3]}" style="color:var(--cool);text-decoration:none">${r[3] === 'lab' ? 'Open lab' : 'Open page'}</a></td></tr>`).join('')}</tbody></table></div></section>
      <section class="band"><div class="sec-head"><h2>Source summaries</h2><p>Written from each page. Where a page could not be fully read, the card says so.</p></div>
        <div class="refgrid">${g.MGF_REFS.map(r => `<article class="panel ref" id="ref-${r.id}">
          <div class="meta"><span class="tag">${esc(r.type)}</span></div>
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.summary)}</p>
          <ul>${r.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          ${r.caveat ? `<p class="caveat">${esc(r.caveat)}</p>` : ''}
          <div class="uses"><h4>How Ember Watch uses it</h4>${r.uses.map(u => go(u[0], u[1])).join('')}</div>
          <div><a class="btn sm ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Open the source</a></div>
        </article>`).join('')}</div></section>
      <section class="band"><p class="note">Ember Watch's own numbers come from nine analysed droplet-combustion files supplied with the project, not from the pages above. These sources explain why the mechanisms matter and what the wider NASA programme is learning.</p></section>`;
    root.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); location.hash = a.dataset.go; } });
  }
  g.MGFRefs = { render };
})(window);
