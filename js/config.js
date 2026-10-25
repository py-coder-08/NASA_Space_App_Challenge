/* ============================================================
   MODEL SETTINGS  (safe to edit)
   Change a number, save the file, refresh the browser.
   ============================================================ */
window.MGF_CONFIG = {

  /* How much each factor counts toward the 0-100 risk score.
     These seven must add up to 1.00. */
  weights: {
    flame:   0.18,   // flame size and growth
    thermal: 0.12,   // temperatures
    energy:  0.22,   // heat release and radiated power
    persist: 0.10,   // how long it burns and how hard it is to see
    atmos:   0.14,   // oxygen, pressure, humidity, airflow
    gas:     0.14,   // CO, soot, oxygen depletion
    context: 0.10    // crew distance and nearby critical equipment
  },

  /* Score cut-offs for the risk level (score is 0-100) */
  levels: { low: 30, moderate: 48, high: 66 },   // >= high is "Critical"

  /* Step 3 of the decision tree: any one of these counts as "fire or unsafe condition".
     Values follow the thresholds in the reference decision-tree figure. */
  triggers: {
    ambientTempC: 60,      // hot spot, deg C
    coPpm: 10,             // CO above this is abnormal, ppm
    sootPpm: 100,          // soot volume fraction 0.01 % = 100 ppm
    humidityPct: 40,       // below this the fire risk rises (a risk factor, not a trigger on its own)
    flameMm: 40,           // flame larger than this is outside the expected range, mm
    flameGrowthMmS: 20,    // growth faster than this is outside the expected range, mm/s
    flameTempK: 800        // peak temperature above this counts as a flame
  },

  /* Hard rules that can only raise the level, never lower it (Step 5) */
  overrides: {
    coHighPpm: 50,         // CO at or above this forces at least HIGH
    crewCloseM: 1.0,       // a hot flame this close to crew forces at least HIGH
    o2HighPct: 30          // a hot flame in air this rich in oxygen forces at least HIGH
  },

  /* Default cabin conditions for the demo datasets (editable in the page too) */
  defaultContext: {
    O2: 21,                // oxygen, % by volume
    humidity: 45,          // relative humidity, %
    ambientC: 22,          // cabin air temperature, deg C
    ventCmS: 15,           // air speed, cm/s
    volumeM3: 50,          // free cabin volume, m3
    fuelLoadG: 15,         // fuel or material that could burn, grams
    crewDistM: 4,          // distance from flame to nearest crew member, m
    assets: 'nearby'       // 'none' | 'nearby' | 'adjacent'  critical equipment near the flame
  },

  /* Fuel properties used for heat release (public handbook values) */
  fuels: {
    C7:   { name: 'n-heptane',   rho: 684, dHc: 44.6e6 },
    C10:  { name: 'n-decane',    rho: 730, dHc: 44.2e6 },
    C12:  { name: 'n-dodecane',  rho: 750, dHc: 44.1e6 },
    OTHER:{ name: 'Other liquid hydrocarbon', rho: 780, dHc: 43.0e6 }
  },

  /* Model assumptions that are NOT measured in the NASA files. Edit with care. */
  assumptions: {
    hotRadiatedFraction: 0.8,   // radiated power / heat release, hot flame (fit to NASA radiance)
    coolRadiatedFraction: 0.22, // same, cool flame (fit to NASA radiance tail)
    hotKFactor: 0.75,           // hot-stage K relative to cool-regime K (fit to three-stage data)
    fullBurnKFactor: 1.5,       // K of small droplets that burn hot to the end, relative to cool-regime K
    flameRatioHot: 7.5,         // flame diameter / droplet diameter at 1 atm (fit to NASA flame sizes)
    flameRatioPressureExp: -0.25,
    coolFlameRatio: 6.0,
    o2KPerPct: 0.025,           // burning-rate gain per extra % O2
    o2TPerPct: 14,              // peak flame temperature gain per extra % O2, K
    coYieldHot: 0.02,           // kg CO per kg fuel burned in a hot flame
    coYieldCool: 0.10,          // kg CO per kg fuel burned in a cool flame (partial oxidation)
    sootRefPpm: 12,             // in-flame soot volume fraction of a hot flame at 1 atm, ppm
    coolOnlyTempK: 1150,        // cool-flame peak temperature in the 600 K gas experiments
    smallDropletMm: 3.5         // below this a droplet burns hot to the end (no radiative extinction)
  }
};
