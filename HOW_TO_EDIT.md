# How to edit Ember Watch

Open the folder in any text editor. Double-click index.html to run the site in your browser (needs internet for the chart library and fonts).

| What you want to change | File | What to do |
|---|---|---|
| Site name, hero headline, dashboard text, button labels, section headings | js/content.js | Change the text between the quotes. Keep quotes and commas. |
| The risk report wording (actions, precautions, prevention, monitoring) | js/content.js, section "report" | Edit, add or delete lines inside the [ ] lists. |
| Weights, Low/Moderate/High cut-offs, alarm thresholds, default cabin, fuel properties, model assumptions | js/config.js | Change the numbers. The seven weights must add up to 1.00. |
| Guided-tour pop-up wording and the 3D viewer captions | js/content.js, sections "tour" and "viewer" | Edit the title and body text. Which elements the tour points at is set in js/tour.js. |
| Small illustrations on the dashboard (benefit tiles, Earth vs space flame) | js/visuals.js | Each picture is a small SVG function. Which picture goes with which benefit is set in js/app.js (search "bento"). |
| References page (summaries, links, how each source is used) | js/references.js | Edit the text in MGF_REFS and the mapping table in MGF_REFMAP. |
| Dashboard benefits, "what makes it different" table, closing call to action | js/content.js, sections "benefits", "special", "cta" | Edit the text. |
| Colours and fonts | css/style.css | Edit the values at the top (:root). |
| Add or change a NASA data set | js/data.js | Generated from the Excel files. Ask Claude to regenerate it if you add files. |
| The scoring formulas themselves | js/engine.js | Function assess(). If you change a threshold here, update the matching text in js/method.js. |

Pages: Dashboard (js/app.js), Modeling lab (js/lab.js), Methodology (js/method.js), References (js/references.js). The 3D flame is js/flame3d.js and the guided tour is js/tour.js. index.html holds the shell.
