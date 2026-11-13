/* ============================================================
   FIRE SAFETY LESSONS  (safe to edit)
   Real incidents and the safety technology that came from them. This is kept
   apart from the research references. Each lesson lists what to learn and
   corrective actions that can be added to the action tracker with one click.
   ============================================================ */
window.MGF_LESSON_CATS = [
  { id: 'fires', title: 'Fires aboard crewed spacecraft', blurb: 'What went wrong when a fire started where the crew could not leave.' },
  { id: 'design', title: 'Design and change-control failures', blurb: 'A fire or explosion that began as a small mismatch nobody caught.' },
  { id: 'tech', title: 'Detection, protection and response technology', blurb: 'Equipment built for spaceflight that now protects firefighters on Earth, and what it suggests for habitats.' }
];

window.MGF_LESSONS = [
  {
    id: 'apollo1', cat: 'fires', year: '1967', title: 'Apollo 1 cabin fire',
    url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1',
    source: 'NASA Safety and Mission Assurance: Apollo 1 lessons learned',
    summary: 'On 27 January 1967, during a launch-pad test with the cabin pressurised with 100 % oxygen, a flash fire swept the Command Module and killed Grissom, White and Chaffee. Rising heat and pressure cracked the cabin within seconds. Investigators found the crew died of carbon monoxide and other toxic gases, and that their burns were likely survivable.',
    facts: ['Ignition source was never definitively identified. Arcing was found in wires near the environment control system.', 'The three-piece hatch took 90 seconds to open under ideal conditions and could not be opened under pressure.', 'The test was judged non-hazardous because the rocket was unfuelled, so safety groups did not review it and no rescue process existed.'],
    learn: ['An oxygen-rich atmosphere turns a small ignition into a fast fire. Atmosphere and materials must be controlled together.', 'Escape time is a safety limit in its own right. If the exit is slower than the fire, the exit is the hazard.', 'Toxic gas, not flame, can be the main killer. Gas and visibility belong in the risk score.', 'A test that looks harmless still needs a hazard review and a rescue plan.'],
    fixes: ['Hatch replaced by one that opens in 3 seconds from inside or outside.', 'Combustible materials severely restricted in the Command Module and Lunar Module.', 'Fire-resistant spacesuit materials.', 'Safety and management culture changes after congressional hearings.'],
    actions: ['Time a crew escape from every hatch and door under worst-case conditions and record it', 'Review oxygen-enriched atmosphere limits and the materials allowed inside them', 'Add every ground test and drill to the hazard review, even ones labelled low risk', 'Inspect wiring near environment-control equipment for arcing and damaged insulation'],
    uses: [['Oxygen above 30 % with a hot flame raises the level', 'method'], ['Toxic gas factor', 'method'], ['Crew distance override', 'method']]
  },
  {
    id: 'mir', cat: 'fires', year: '1997', title: 'Mir oxygen-generator fire',
    url: 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/',
    source: 'NASA History: 25 years ago, fire aboard space station Mir',
    summary: 'On 24 February 1997 a solid-fuel oxygen generator canister in the Kvant-1 module ignited while a crew member was activating it. The flame was about three feet long, threw sparks and molten metal, and filled the modules with dense smoke. NASA calls it the worst in-orbit fire in the history of spaceflight.',
    facts: ['The canister type had been used more than 2,500 times without incident. Investigators later said hydrocarbons raised the risk and the likeliest cause was latex glove material accidentally inside it.', 'The smoke blocked the route to the Soyuz escape vehicle for three crew members.', 'The crew put on oxygen masks, sprayed foam from extinguishers and the flame burned out. The station structure was not damaged.', 'Crew had risen to six during a handover that began 12 days earlier.'],
    learn: ['An oxygen source is also a fire source. Treat it with the same care as fuel.', 'A good record is not proof of safety. Small contamination can defeat a proven part.', 'Smoke can cut off an escape route, so every crew member needs a second route and a mask within reach.', 'Extra crew means extra oxygen demand and more people to evacuate.'],
    fixes: ['Emergency training and ground-controller support were changed.', 'Ground preparation of the canisters was changed.', 'The ISS uses three Elektron units in the Russian segment plus a US Oxygen Generation System, and keeps the canister type as a backup or for larger crews, with added safety measures.'],
    actions: ['Audit handling and storage of oxygen generators and other oxidiser sources for contamination', 'Confirm every crew member has two clear escape routes and a mask within reach', 'Check extinguisher type, location and crew training for a fire that blocks a route', 'Review life-support capacity and evacuation plans before any crew increase'],
    uses: [['Atmosphere factor and oxygen slider', 'lab'], ['Smoke and gas factor', 'method'], ['Hard override for crew within 1 m of a hot flame', 'method']]
  },
  {
    id: 'apollo13', cat: 'design', year: '1970', title: 'Apollo 13 oxygen tank explosion',
    url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-13',
    source: 'NASA Safety and Mission Assurance: Apollo 13 lessons learned',
    summary: 'Oxygen tank two exploded on the third day of the mission and damaged tank one, cutting power and water supply from the fuel cells. The review board found a combination of mistakes and a deficient design.',
    facts: ['In 1965 the permitted heater voltage for the tanks rose from 28 to 65 V DC, but the heater thermostats were not changed to match.', 'During the final pad test the heaters stayed on and reached about 1,000 degrees F, degrading the Teflon insulation on the wiring.', 'The tank was left vulnerable for the next oxygen fill.'],
    learn: ['When one part of a design changes, every connected part must be re-checked.', 'Damage done in a test can sit unseen until the next use. Inspect after every abnormal event.', 'Strong oversight of engineering and manufacturing catches gaps that individual teams miss.', 'Redundancy only helps if the backups do not share the same failure.'],
    fixes: ['Oxygen storage redesigned and recertified, with a NASA-wide review of cryogenic oxygen systems.', 'A third oxygen tank in a different bay, upgraded thermostats and removed stirring fans.', 'All electrical wiring sheathed in stainless steel.'],
    actions: ['Add a change-control check: when a rating changes, list every dependent component and confirm each was updated', 'Inspect insulation and wiring after any test where heaters or power ran outside normal limits', 'Confirm backup oxygen and power sources are physically separate and do not share a failure'],
    uses: [['Energy and thermal factors', 'method'], ['Sensitivity table: change one input and re-check', 'lab']]
  },
  {
    id: 'detector', cat: 'tech', year: '1978', title: 'Incipient fire detector (shuttle-derived)',
    url: 'https://spinoff.nasa.gov/node/9407',
    source: 'NASA Spinoff: fire detector based on the Brunswick Incipient Fire Detector',
    summary: 'A detector based on the one used in space shuttle orbiters. It samples air to find combustion particles, tells them apart from dust, and warns of a developing fire before flame or smoke appears. In large sites several sensors can feed one central display that shows where the fire is.',
    facts: ['Fewer false alarms because it separates combustion particles from dust.', 'Earlier warning than a typical commercial smoke detector.', 'Multiple sensors can share one processor to locate the fire.'],
    learn: ['Detect combustion products, not only smoke. A cool flame may give off little smoke.', 'False alarms erode trust. A detector that ignores dust is more likely to be believed.', 'Know where as well as whether: locating the fire shortens the response.'],
    fixes: [],
    actions: ['Review whether detectors in the habitat sense combustion particles or gas, not only smoke', 'Record false-alarm rates for each detector and act on the worst ones'],
    uses: [['Step 1 sensor channels, detectability factor', 'method']]
  },
  {
    id: 'airtank', cat: 'tech', year: '1976', title: 'Lightweight firefighter air tanks',
    url: 'https://spinoff.nasa.gov/node/9582',
    source: 'NASA Spinoff: firefighter\'s air tanks (Scott Aviation with Johnson Space Center)',
    summary: 'A breathing system developed with NASA Johnson. The backpack weighs about 20 lb, roughly 13 lb less than conventional tanks, and gives a 30-minute air supply. The tank holds 4,500 psi in an aluminium liner wrapped in resin-impregnated glass fibre. A redesigned mask improves vision and a personal low-air alarm warns only the wearer.',
    facts: ['About twice the pressure of earlier tanks at much lower weight.', 'Low-air alarm is personal so it does not add confusion in a chaotic scene.'],
    learn: ['Breathable air is the first line of defence in smoke, as the Mir crew showed with their masks.', 'Weight and visibility decide whether protective gear is actually used.', 'Warnings should reach the person who must act, without adding noise.'],
    fixes: [],
    actions: ['Check that breathing equipment is within reach of every crew position and the air supply time is known', 'Test mask fit and visibility during drills'],
    uses: [['Toxic gas factor and response steps in the report', 'lab']]
  },
  {
    id: 'fires2', cat: 'tech', year: '1982', title: 'Project FIRES protective ensemble',
    url: 'https://spinoff.nasa.gov/node/9918',
    source: 'NASA Spinoff: Project FIRES (Firefighter\'s Integrated Response Equipment System)',
    summary: 'A NASA and U.S. Fire Administration project that applied lightweight, fire-resistant, heat-protective materials from spacesuits and spacecraft thermal protection to firefighter gear. Fourteen municipal fire departments took part in field evaluation, with the data meant to inform national protective-equipment standards.',
    facts: ['Marshall Space Flight Center provided technical management.', 'Design drew on materials and concepts from the Apollo programme.'],
    learn: ['Field testing with real users turns a good material into a usable standard.', 'Protective materials cut injuries only when they are light enough to wear and move in.'],
    fixes: [],
    actions: ['Schedule a drill with the full protective kit and record any item that slows movement', 'Check protective-kit condition and expiry dates'],
    uses: [['Response steps in the risk report', 'lab']]
  }
];
