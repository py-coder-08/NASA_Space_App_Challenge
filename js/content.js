/* ============================================================
   SITE TEXT  (safe to edit)
   Change any text between the quotes, save, refresh the browser.
   Keep the quote marks and the commas.  Do not remove a key.
   ============================================================ */
window.MGF_CONTENT = {

  site: {
    name: "Ember Watch",                                  // site name shown in the top bar
    tagline: "AI fire-safety insight from NASA microgravity combustion data",
    footer: "Built on NASA PSI-117 droplet-combustion data. A research and education tool. It does not replace mission flight rules, crew procedures or certified fire detection."
  },

  /* ---------- Dashboard: hero ---------- */
  hero: {
    title: "Fire behaves differently when nothing rises",
    lead: "In microgravity a flame is a sphere, not a teardrop. Smoke does not climb to the ceiling, cool flames can burn unseen, and a flame that looks out may not be. Ember Watch turns NASA droplet-combustion data into a clear risk level, a reasoned decision path and a plan of action.",
    primaryButton: "Open the modeling lab",
    secondaryButton: "Take the 2-minute tour",
    tertiaryButton: "How the risk is calculated",
    stageCaption: "Live model: a 4.5 mm n-dodecane droplet burning at 1 atm. Drag to rotate."
  },

  /* ---------- Dashboard: benefits ---------- */
  benefits: {
    heading: "What Ember Watch gives you",
    lead: "One place to see how a fire behaves in space, how risky it is, and what to do about it.",
    items: [
      { title: "See what cameras miss", body: "Six sensor channels, including infrared, UV and Schlieren, are checked against the flame. The report tells you when a cool flame would slip past a camera or smoke detector." },
      { title: "Follow every decision", body: "The risk level is not a black box. A six-step decision tree shows the numbers behind each choice, from detection to response." },
      { title: "Built on real NASA data", body: "Nine analysed files from NASA droplet-combustion work drive the demos, so every curve and number can be traced to a measurement or a stated model." },
      { title: "Test your own conditions", body: "Enter a fuel, pressure, oxygen level and droplet size, or paste a measured time series. The model simulates the burn and scores it." },
      { title: "Summary or detail, your choice", body: "Get a one-screen verdict for a quick decision, or open the detailed analysis for every factor, what-if row and data source." },
      { title: "A report you can act on", body: "Each analysis ends with a risk level, ranked drivers, immediate actions, precautions and preventive measures you can copy out." }
    ]
  },

  /* ---------- Dashboard: what makes it special ---------- */
  special: {
    heading: "What makes Ember Watch different",
    lead: "Most fire tools were designed for rising smoke and a flame that stands up. Space breaks both assumptions.",
    rows: [
      ["Looks for a smoke plume that rises", "Reads flame temperature, size, radiation and gas, because nothing rises in microgravity"],
      ["Treats every flame as one thing", "Separates hot flames from cool flames, which burn at low temperature and are nearly invisible"],
      ["Gives one alarm threshold", "Scores seven weighted factors, then lets hard safety rules raise the level"],
      ["Explains little about the result", "Walks a decision tree and shows the numbers at every step"],
      ["Starts from Earth experiments", "Starts from microgravity droplet-combustion measurements and says where it is assuming"],
      ["Fixed examples only", "Lets you change pressure, oxygen, droplet size and airflow and watch a 3D flame respond"]
    ],
    col1: "A typical Earth-style approach",
    col2: "Ember Watch",
    earthCaption: "Looks for a teardrop flame and a rising smoke column.",
    spaceCaption: "Expects a sphere, no plume, and a cool flame you may not see."
  },

  /* ---------- Dashboard: closing call to action ---------- */
  cta: {
    heading: "Start with a flame",
    body: "Open the lab, pick a NASA data set and watch the decision tree work through it. Or enter your own conditions.",
    button: "Open the modeling lab",
    second: "Read the research behind it"
  },

  /* ---------- Dashboard: why microgravity changes fire ---------- */
  why: {
    heading: "What changes in microgravity",
    items: [
      { title: "Flames spread as a sphere", body: "With no buoyancy there is no upward plume. The flame wraps the fuel in a shell and grows outward in every direction." },
      { title: "Droplets do not fall", body: "Fuel stays where it is, so vapour and air mix more slowly and burning can be steadier and longer." },
      { title: "Soot is thicker", body: "Weak flow means soot stays near the flame instead of being carried off, and radiation from it is stronger." },
      { title: "Fire is harder to see", body: "No smoke column rises to a detector. Cool flames glow so faintly that cameras alone can miss them." },
      { title: "Suppression must be local", body: "Flooding a module with suppressant can starve the crew of oxygen. Response has to be targeted and measured." },
      { title: "Everything is shared air", body: "A cabin is a closed volume. What one flame produces, CO and soot included, reaches everyone." }
    ]
  },

  /* ---------- Dashboard: ranking section ---------- */
  ranking: {
    heading: "Risk ranking across the NASA data sets",
    lead: "Every condition in the nine files, scored by the same method and the same default cabin. Select a row to open it in the modeling lab."
  },

  /* ---------- Dashboard: how it works ---------- */
  steps: {
    heading: "How an analysis runs",
    items: [
      { title: "Detect", body: "Six sensor channels watch for a flame: visible, UV, infrared, Schlieren, soot and gas." },
      { title: "Analyze", body: "Burning rate, flame size, temperature, heat release and toxic gas are estimated from the data." },
      { title: "Decide", body: "A six-step decision tree checks for fire, evaluates it in context, and sets a risk level." },
      { title: "Respond", body: "The level selects automated mitigation, escalation, or maximum response." },
      { title: "Protect", body: "The report lists precautions and prevention so the next event is smaller or never starts." }
    ]
  },

  /* ---------- Dashboard: data library ---------- */
  library: {
    heading: "The data behind the demo",
    lead: "Nine analysed files from NASA's PSI-117 droplet-combustion work (PROCI 2019, PROCI 2023 and MST 2024). Open any of them in the lab to see the curves and the risk read-out."
  },

  /* ---------- Dashboard: honest limits ---------- */
  limits: {
    heading: "What this is, and what it is not",
    body: "The NASA files describe burning fuel droplets in controlled chambers. Ember Watch uses what those droplets show about flame temperature, size, burning rate, radiation and extinction, then scales the result to a cabin you describe. Some inputs, such as humidity, crew distance and fuel on hand, are your assumptions and are marked as such. The model covers microgravity only. Lunar and other partial gravity are not modelled yet. Treat the output as decision support for study and planning."
  },

  /* ---------- Modeling page ---------- */
  modeling: {
    heading: "Microgravity combustion lab",
    lead: "Pick a NASA data set to see the real curves and the full risk read-out, or enter your own conditions and let the model simulate the burn.",
    demoTab: "NASA demo data",
    ownTab: "Your own data"
  },

  /* ---------- Methodology page ---------- */
  method: {
    heading: "How the risk is worked out",
    lead: "Seven factors, each scored from 0 to 1 against a stated range, are weighted and added into a 0 to 100 score. This page shows each formula, where its numbers come from in the NASA data, and how that factor changes a microgravity flame."
  },

  /* ---------- Risk report text (used by every analysis) ---------- */
  report: {
    low: [
      "Adjust ventilation or airflow so the flame is not fed fresh oxygen.",
      "Reduce ignition sources near the flame.",
      "Cut power automatically to non-critical equipment in the area.",
      "Apply localized inert-gas suppression if the flame persists.",
      "Keep close monitoring and reassess in real time."
    ],
    moderate: [
      "Activate localized suppression at the affected module.",
      "Isolate the affected module (close hatches, stop recirculation).",
      "Increase monitoring frequency on all six sensor channels.",
      "Notify crew with audible and visual alerts.",
      "Send data to mission control if a link is available.",
      "Reassess continuously until the flame is confirmed out."
    ],
    high: [
      "Activate full suppression for the affected volume.",
      "Cut power and isolate the fuel source.",
      "Evacuate or protect crew; put on breathing protection.",
      "Shut down non-essential systems and stop air recirculation.",
      "Send an emergency call to mission control.",
      "Maintain safety and monitor for re-ignition; cool flames can restart."
    ],
    precautionsBase: [
      "Keep suppression and breathing protection where the crew can reach them in seconds.",
      "Confirm that at least two sensor types (for example IR and gas) cover each area where fuel is handled.",
      "Re-check the area after any flame is reported out. Wait for temperature and CO to fall before standing down."
    ],
    preventBase: [
      "Store fuels and flammable materials in sealed, labelled containers and keep the quantity on hand low.",
      "Remove or shield ignition sources (hot surfaces, arcing equipment) from fuel handling areas.",
      "Keep oxygen fraction and cabin pressure at the lowest values the mission allows.",
      "Run detection drills so crew know what a cool-flame alarm looks like.",
      "Log every event and feed it back into thresholds after each review."
    ],
    monitoring: [
      "Log temperature, CO and soot every second while any trigger is active.",
      "Check sensor health before and after the event.",
      "Keep watching for at least several minutes after the last alarm, since cool flames can persist or restart."
    ]
  },
  /* ---------- Guided tour pop-ups ---------- */
  tour: {
    skip: "Skip", back: "Back", next: "Next", done: "Done", guide: "Guide me",
    lab: {
      tabs: { title: "Choose your data", body: "Use NASA demo data to see real curves, or switch to Your own data to enter conditions and let the model simulate the burn." },
      sets: { title: "Pick a NASA data set", body: "Nine files from NASA droplet-combustion work. Some have several conditions, such as different pressures. Select one and everything on the right updates." },
      cabin: { title: "Set the cabin", body: "These are your assumptions: oxygen, humidity, airflow, crew distance and fuel on hand. They are not in the NASA files, and they change the risk." },
      depth: { title: "Summary or detailed", body: "Summary gives the verdict and the main actions. Detailed shows every factor, the numbers at each tree step, what-if rows and data sources." },
      verdict: { title: "The verdict", body: "The gauge shows the 0 to 100 risk score and level. The tiles show the key numbers, each tagged as NASA data, model, assumed or yours." },
      flame: { title: "Live 3D flame", body: "Drag to rotate. Move the sliders for pressure, oxygen, droplet size and airflow and the flame changes size, colour and shape at once. Press Play to watch a whole burn." },
      charts: { title: "The data behind it", body: "Curves from the selected NASA file, experiment against model. Detailed mode shows all of them." },
      tree: { title: "The safety decision tree", body: "Six steps from detection to response. The highlighted path is this event. Press Replay step by step to walk through it one decision at a time." },
      report: { title: "Your risk report", body: "Risk level, what drives it, the response for that level, precautions and prevention. Copy report puts it all on your clipboard." }
    },
    dashboard: {
      stage: { title: "A flame in microgravity", body: "This is a live model of a burning fuel droplet. The flame is a sphere because nothing rises. Drag to rotate it." },
      benefits: { title: "What you get", body: "A short tour of what Ember Watch can do for a fire-safety review." },
      ranking: { title: "Risk ranking", body: "Every NASA condition scored the same way. Select a row to open it in the lab." },
      library: { title: "The data library", body: "The nine NASA files behind the demo. Open any of them in the lab." },
      nav: { title: "Explore the other pages", body: "Modeling lab for analysis, Methodology for the maths, and References for the NASA sources behind the mechanisms." }
    },
    method: {
      factors: { title: "Seven factors", body: "Each factor has a weight, a formula, the reason it matters in microgravity and what the NASA data shows." },
      sandbox: { title: "Try the sliders", body: "Change a condition and watch each factor score and the total move. It uses the same engine as the lab." }
    }
  },

  /* ---------- Lab: 3D flame viewer ---------- */
  viewer: {
    heading: "Live 3D flame",
    lead: "Change a condition and the flame responds. Size, colour and shape come from the same droplet-burning model that scores the risk.",
    note: "Shape under airflow is illustrative. The NASA droplet tests were run in still gas."
  },

  /* ---------- References page ---------- */
  refs: {
    heading: "References and research notes",
    lead: "The NASA work behind the mechanisms in Ember Watch. Each source is summarised and linked to the part of the site that uses it."
  }
};
